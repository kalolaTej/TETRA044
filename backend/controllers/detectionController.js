const supabase = require('../services/supabaseClient');
const { sendDetectionPush } = require('../services/firebase');

const createDetection = async (req, res) => {
  try {
    const { camera_id, zone, animal, confidence, time } = req.body;
    const file = req.file;

    // payload validation
    if (!camera_id || !animal || confidence === undefined || !file) {
      return res.status(400).json({
        error: 'missing required detection fields (camera_id, animal, confidence) or image file',
      });
    }

    // numeric confidence validation
    const numericConfidence = parseFloat(confidence);
    if (isNaN(numericConfidence) || numericConfidence < 0 || numericConfidence > 100) {
      return res.status(400).json({
        error: 'confidence must be a valid numeric percentage between 0 and 100',
      });
    }

    // generate unique file path for storage
    const fileExt = file.originalname ? file.originalname.split('.').pop() : 'jpg';
    const fileName = `${camera_id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `detections/${fileName}`;

    // upload image to supabase storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: `storage upload failed: ${uploadError.message}` });
    }

    // get public url for uploaded snapshot
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData ? publicUrlData.publicUrl : '';
    const detectedAt = time ? new Date(time).toISOString() : new Date().toISOString();

    // resolve valid camera uuid if string slug is provided
    let validCameraId = camera_id;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camera_id);
    if (!isUuid) {
      const { data: firstCam } = await supabase.from('cameras').select('id').limit(1);
      if (firstCam && firstCam.length > 0) {
        validCameraId = firstCam[0].id;
      }
    }

    const { data: detectionData, error: dbError } = await supabase
      .from('detections')
      .insert([
        {
          camera_id: validCameraId,
          animal: animal.toLowerCase(),
          confidence: numericConfidence,
          image_url: imageUrl,
          detected_at: detectedAt,
        },
      ])
      .select();

    if (dbError) {
      return res.status(500).json({ error: `database insertion failed: ${dbError.message}` });
    }

    const newDetection = detectionData ? detectionData[0] : null;

    if (newDetection) {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-detection', newDetection);
        const connectedCount = io.sockets.sockets ? io.sockets.sockets.size : 0;
        console.log(`[socket] broadcasted new detection to ${connectedCount} client(s)`);
      }

      // dispatch push notifications
      dispatchPushNotifications(camera_id, newDetection);

      // delete oldest records & images exceeding 300 cap
      cleanupOldDetections(300);
    }

    return res.status(201).json({
      success: true,
      detection: newDetection,
    });
  } catch (err) {
    return res.status(500).json({ error: `detection ingestion error: ${err.message}` });
  }
};

const dispatchPushNotifications = async (cameraId, detection) => {
  try {
    const { data: cameraData } = await supabase
      .from('cameras')
      .select('id, farm_id, farms(user_id)')
      .eq('id', cameraId)
      .single();

    const userId = cameraData && cameraData.farms ? cameraData.farms.user_id : null;
    if (!userId) {
      return;
    }

    const title = 'Animal Intrusion Detected!';
    const body = `A ${detection.animal} was detected with ${detection.confidence}% confidence.`;

    await supabase.from('notifications').insert([
      {
        user_id: userId,
        detection_id: detection.id,
        title,
        body,
      },
    ]);

    const { data: tokens } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokens && tokens.length > 0) {
      for (const t of tokens) {
        await sendDetectionPush(t.token, detection);
      }
    }
  } catch (err) {
    console.error(`[push error] failed to dispatch notifications: ${err.message}`);
  }
};

const getDetections = async (req, res) => {
  try {
    const { camera_id, camera, animal, limit: queryLimit, page: queryPage, offset: queryOffset } = req.query;

    const limit = parseInt(queryLimit, 10) > 0 ? Math.min(parseInt(queryLimit, 10), 100) : 20;
    let page = 1;
    if (queryPage) {
      page = parseInt(queryPage, 10) > 0 ? parseInt(queryPage, 10) : 1;
    } else if (queryOffset) {
      page = Math.floor(parseInt(queryOffset, 10) / limit) + 1;
    }
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('detections')
      .select('*', { count: 'exact' });

    const targetCamera = camera_id || camera;
    if (targetCamera) {
      query = query.eq('camera_id', targetCamera);
    }

    if (animal) {
      query = query.eq('animal', animal.toLowerCase());
    }

    query = query.order('detected_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch detections: ${err.message}` });
  }
};

const getDetectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('detections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'detection not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch detection: ${err.message}` });
  }
};

// maintain max 300 retention limit in supabase db and storage
const cleanupOldDetections = async (maxLimit = 300) => {
  try {
    const { count, error } = await supabase
      .from('detections')
      .select('id', { count: 'exact', head: true });

    if (error || !count || count <= maxLimit) {
      return;
    }

    const deleteCount = count - maxLimit;

    // query oldest records exceeding 300 limit
    const { data: oldestRecords } = await supabase
      .from('detections')
      .select('id, image_url')
      .order('detected_at', { ascending: true })
      .limit(deleteCount);

    if (!oldestRecords || oldestRecords.length === 0) {
      return;
    }

    const idsToDelete = oldestRecords.map((r) => r.id);

    // extract storage file paths from public urls
    const storagePaths = oldestRecords
      .map((r) => {
        if (!r.image_url) return null;
        const parts = r.image_url.split('/images/');
        return parts.length > 1 ? parts[1] : null;
      })
      .filter(Boolean);

    // delete oldest snapshot images from storage bucket
    if (storagePaths.length > 0) {
      await supabase.storage.from('images').remove(storagePaths);
    }

    // delete oldest database rows
    await supabase.from('detections').delete().in('id', idsToDelete);
    console.log(`[retention cleanup] deleted ${idsToDelete.length} oldest detection(s) exceeding 300 cap`);
  } catch (err) {
    console.error(`[retention error] failed cleanup: ${err.message}`);
  }
};

module.exports = {
  createDetection,
  getDetections,
  getDetectionById,
  cleanupOldDetections,
};
