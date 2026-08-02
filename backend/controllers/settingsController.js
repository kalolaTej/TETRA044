// system settings store (confidence threshold, RTSP feeds, cooldown)
let systemSettings = {
  confidenceThreshold: 50, // default 50%
  cooldownPeriod: 10,
  rtspUrl: 'rtsp://192.168.1.100:554/stream1',
  emailAlerts: true
};

const getSettings = (req, res) => {
  return res.status(200).json({ success: true, settings: systemSettings });
};

const updateSettings = (req, res) => {
  try {
    const { confidenceThreshold, cooldownPeriod, rtspUrl, emailAlerts } = req.body;

    if (confidenceThreshold !== undefined) {
      const conf = parseFloat(confidenceThreshold);
      systemSettings.confidenceThreshold = isNaN(conf) ? 50 : Math.max(0, Math.min(100, conf));
    }
    if (cooldownPeriod !== undefined) systemSettings.cooldownPeriod = parseInt(cooldownPeriod, 10) || 10;
    if (rtspUrl !== undefined) systemSettings.rtspUrl = rtspUrl;
    if (emailAlerts !== undefined) systemSettings.emailAlerts = Boolean(emailAlerts);

    console.log(`[settings] updated system threshold to ${systemSettings.confidenceThreshold}%`);

    return res.status(200).json({ success: true, settings: systemSettings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSystemSettings: () => systemSettings
};
