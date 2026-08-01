const supabase = require('../services/supabaseClient');

// basic email regex validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'valid email is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters long' });
    }

    // sign up user in supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const user = authData.user;
    if (!user) {
      return res.status(400).json({ error: 'user registration failed' });
    }

    // insert matching record into users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([{ id: user.id, name: name.trim(), email: email.trim().toLowerCase() }]);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    return res.status(201).json({
      message: 'user registered successfully',
      user: { id: user.id, name: name.trim(), email: email.trim().toLowerCase() },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'valid email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }

    // authenticate against supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'invalid email or password' });
    }

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
      },
      accessToken: data.session.access_token,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
