// simple in-memory sliding window rate limiter for edge camera requests
const requestLogs = new Map();

const detectionRateLimiter = (req, res, next) => {
  const identifier = req.body?.camera_id || req.ip || 'global';
  const now = Date.now();
  const windowMs = 1000; // 1 second window
  const maxRequests = 5; // maximum 5 frame posts per second per camera/ip

  const timestamps = requestLogs.get(identifier) || [];
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    console.warn(`[rate-limiter] rate limit exceeded for identifier: ${identifier}`);
    return res.status(429).json({ error: 'too many detection requests, rate limit exceeded' });
  }

  validTimestamps.push(now);
  requestLogs.set(identifier, validTimestamps);
  next();
};

module.exports = detectionRateLimiter;
