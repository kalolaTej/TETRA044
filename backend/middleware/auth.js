const supabase = require('../services/supabaseClient');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // check if authorization header exists and starts with bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'authorization token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // verify jwt access token with supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'invalid or expired authorization token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'failed to authenticate token' });
  }
};

module.exports = authMiddleware;

// usage example: router.get('/profile', authMiddleware, getProfileController);
