const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('[supabase warning] SUPABASE_URL or SUPABASE_SERVICE_KEY missing in backend .env. Operating in fallback mode.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
