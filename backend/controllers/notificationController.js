const supabase = require('../services/supabaseClient');

// register or update an FCM push notification token for the logged-in user
const registerToken = async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user-1';
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: 'fcm_token is required' });
    }

    // upsert to de-duplicate tokens per device
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert(
        [{ user_id: userId, token: fcm_token }],
        { onConflict: 'token' }
      )
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'FCM token registered successfully',
      data: data ? data[0] : null,
    });
  } catch (err) {
    return res.status(500).json({ error: `token registration failed: ${err.message}` });
  }
};

// fetch dynamic notifications / alerts list
const getNotifications = async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && notifications && notifications.length > 0) {
      return res.status(200).json({ data: notifications });
    }

    // dynamic fallback generated from latest detection logs
    const { data: detections } = await supabase
      .from('detections')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(10);

    const dynamicAlerts = (detections || []).map((det, idx) => {
      const conf = det.confidence || 90;
      const severity = conf > 90 ? 'High' : conf > 85 ? 'Medium' : 'Low';
      return {
        id: det.id || `alt_${idx + 1}`,
        animal: det.animal ? det.animal.charAt(0).toUpperCase() + det.animal.slice(1) : 'Wild Animal',
        camera: det.camera_id || 'cam_01',
        time: new Date(det.detected_at || det.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity,
        status: 'Active',
        created_at: det.detected_at || det.created_at || new Date().toISOString()
      };
    });

    return res.status(200).json({ data: dynamicAlerts });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch notifications: ${err.message}` });
  }
};

module.exports = { registerToken, getNotifications };
