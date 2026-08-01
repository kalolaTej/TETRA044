const supabase = require('../services/supabaseClient');

// register or update an FCM push notification token for the logged-in user
const registerToken = async (req, res) => {
  try {
    const userId = req.user.id;
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

module.exports = { registerToken };
