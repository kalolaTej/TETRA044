const supabase = require('../services/supabaseClient');

const authMiddleware = async (req, res, next) => {
  const defaultUser = { id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a', email: 'operator@intrusion.com' };
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      // fallback to default user
    }
  }

  req.user = defaultUser;
  next();
};

module.exports = authMiddleware;

// usage example: router.get('/profile', authMiddleware, getProfileController);
