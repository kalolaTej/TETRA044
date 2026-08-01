const supabase = require('../services/supabaseClient');
const { sendDetectionPush } = require('../services/firebase');

const createDetection = async (req, res) => {
  try {
    const { camera_id, zone, animal, confidence, time } = req.body;
    const file = req.file;

    // basic payload validation
    if (!camera_id || !animal || confidence === undefined || !file) {
      return res.status(400).json({
        error: 'missing required detection fields (camera_id, animal, confidence) or image file',
      });
    }

    // numeric confidence validation (0-100 percentage)
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

    // upload image buffer to supabase storage 'images' bucket
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

    // insert detection record into database
    const detectedAt = time ? new Date(time).toISOString() : new Date().toISOString();

    const { data: detectionData, error: dbError } = await supabase
      .from('detections')
      .insert([
        {
          camera_id: camera_id,
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
      // note: supabase realtime (postgres change streams) is the primary broadcast mechanism when enabled
      // on the 'detections' table in the supabase dashboard; socket.io acts as a fallback & live demo aid.
      const io = req.app.get('io');
      if (io) {
        io.emit('new-detection', newDetection);
        const connectedCount = io.sockets.sockets ? io.sockets.sockets.size : 0;
        console.log(`[socket] broadcasted new detection to ${connectedCount} connected client(s)`);
      }

      // look up camera -> farm -> user to dispatch push notifications
      dispatchPushNotifications(camera_id, newDetection);
    }

    return res.status(201).json({
      success: true,
      detection: newDetection,
    });
  } catch (err) {
    return res.status(500).json({ error: `detection ingestion error: ${err.message}` });
  }
};

// helper function to resolve user ownership and dispatch push notifications
const dispatchPushNotifications = async (cameraId, detection) => {
  try {
    // resolve user_id via camera -> farm relation
    const { data: cameraData } = await supabase
      .from('cameras')
      .select('id, farm_id, farms(user_id)')
      .eq('id', cameraId)
      .single();

    const userId = cameraData && cameraData.farms ? cameraData.farms.user_id : null;
    if (!userId) {
      return;
    }

    // record notification entry in database
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

    // fetch registered fcm tokens for user
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
    const { camera_id, animal, limit: queryLimit, page: queryPage } = req.query;

    const page = parseInt(queryPage, 10) > 0 ? parseInt(queryPage, 10) : 1;
    const limit = parseInt(queryLimit, 10) > 0 ? Math.min(parseInt(queryLimit, 10), 100) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('detections')
      .select('*', { count: 'exact' });

    if (camera_id) {
      query = query.eq('camera_id', camera_id);
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

module.exports = {
  createDetection,
  getDetections,
  getDetectionById,
};
