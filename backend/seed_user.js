const dotenv = require('dotenv');
dotenv.config();

const supabase = require('./services/supabaseClient');

async function seedUsers() {
  const usersToSeed = [
    { name: 'Farm Operator', email: 'operator@intrusion.com', password: 'password123' },
    { name: 'Admin User', email: 'admin@farm.com', password: 'password123' }
  ];

  for (const u of usersToSeed) {
    console.log(`Attempting registration for: ${u.email}...`);
    try {
      // Create user using Supabase Admin Auth API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name }
      });

      if (authError) {
        if (authError.message.includes('already exists') || authError.message.includes('already registered') || authError.status === 422) {
          console.log(`ℹ️ User ${u.email} already exists in Supabase Auth.`);
        } else {
          console.error(`❌ Auth error for ${u.email}:`, authError.message);
        }
      } else {
        console.log(`✅ Auth user created successfully: ${authData.user.id}`);
        
        // Insert into public.users table if needed
        const { error: dbError } = await supabase
          .from('users')
          .upsert([{ id: authData.user.id, name: u.name, email: u.email }]);

        if (dbError) {
          console.error(`⚠️ DB table insert notice:`, dbError.message);
        } else {
          console.log(`✅ Added to users table in Supabase!`);
        }
      }
    } catch (err) {
      console.error(`Exception seeding ${u.email}:`, err.message);
    }
  }

  console.log('\n--- Seeding Complete ---');
}

seedUsers();
