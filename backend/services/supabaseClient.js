const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// validate required environment variables at startup to prevent silent failures
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('missing required SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
}

// using service role key server-side to bypass row level security for backend administration.
// warning: never expose this key to frontend or client applications.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
