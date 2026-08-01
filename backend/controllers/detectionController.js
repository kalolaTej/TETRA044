const supabase = require('../services/supabaseClient');

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

    return res.status(201).json({
      success: true,
      detection: detectionData ? detectionData[0] : null,
    });
  } catch (err) {
    return res.status(500).json({ error: `detection ingestion error: ${err.message}` });
  }
};

module.exports = { createDetection };
