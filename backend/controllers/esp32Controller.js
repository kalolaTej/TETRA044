const http = require('http');

/**
 * Controller to manually trigger or query ESP32 Deterrent Hardware from Backend/Web Dashboard
 */
const triggerESP32 = async (req, res) => {
  try {
    const { ip, animal, duration } = req.body;
    const esp32Ip = ip || process.env.ESP32_IP || '192.168.1.150';
    const targetAnimal = animal || 'unknown';
    const activeDuration = duration || 5000;

    const url = `http://${esp32Ip}/trigger?animal=${encodeURIComponent(targetAnimal)}&duration=${activeDuration}`;

    http.get(url, (espRes) => {
      let rawData = '';
      espRes.on('data', (chunk) => { rawData += chunk; });
      espRes.on('end', () => {
        return res.status(200).json({
          success: true,
          message: `Deterrent triggered on ESP32 (${esp32Ip}) for ${targetAnimal}`,
          esp32Response: rawData,
        });
      });
    }).on('error', (err) => {
      return res.status(502).json({
        error: `Could not reach ESP32 at http://${esp32Ip}: ${err.message}`,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: `ESP32 trigger error: ${err.message}` });
  }
};

const getESP32Status = async (req, res) => {
  try {
    const esp32Ip = req.query.ip || process.env.ESP32_IP || '192.168.1.150';
    const url = `http://${esp32Ip}/status`;

    http.get(url, (espRes) => {
      let rawData = '';
      espRes.on('data', (chunk) => { rawData += chunk; });
      espRes.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          return res.status(200).json({ success: true, status: parsed });
        } catch (e) {
          return res.status(200).json({ success: true, raw: rawData });
        }
      });
    }).on('error', (err) => {
      return res.status(502).json({
        error: `ESP32 offline or unreachable at http://${esp32Ip}: ${err.message}`,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: `ESP32 status check error: ${err.message}` });
  }
};

module.exports = {
  triggerESP32,
  getESP32Status,
};
