const supabase = require('../services/supabaseClient');

// basic email regex validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // sign up user in supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
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
      .insert([{ id: user.id, name, email }]);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    return res.status(201).json({
      message: 'user registered successfully',
      user: { id: user.id, name, email },
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // authenticate against supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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
    return res.status(500).json({ error: 'internal server error during login' });
  }
};

module.exports = { register, login };
