const dotenv = require('dotenv');
dotenv.config();

const supabase = require('./services/supabaseClient');

async function seedCamera() {
  try {
    // 1. Get user operator@intrusion.com
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'operator@intrusion.com')
      .single();

    let userId;
    if (uErr || !users) {
      console.log('Inserting default user...');
      const { data: newUser } = await supabase
        .from('users')
        .insert([{ name: 'Farm Operator', email: 'operator@intrusion.com' }])
        .select();
      userId = newUser[0].id;
    } else {
      userId = users.id;
    }

    // 2. Check or create farm
    const { data: farms } = await supabase
      .from('farms')
      .select('id')
      .limit(1);

    let farmId;
    if (!farms || farms.length === 0) {
      const { data: newFarm } = await supabase
        .from('farms')
        .insert([{ user_id: userId, name: 'North Perimeter Farm', location: 'Zone A' }])
        .select();
      farmId = newFarm[0].id;
    } else {
      farmId = farms[0].id;
    }

    // 3. Check or create camera
    const { data: cameras } = await supabase
      .from('cameras')
      .select('id, name')
      .limit(1);

    let cameraId;
    if (!cameras || cameras.length === 0) {
      const { data: newCam } = await supabase
        .from('cameras')
        .insert([{ farm_id: farmId, name: 'Cam 01 - North Gate', zone: 'North Perimeter', status: true }])
        .select();
      cameraId = newCam[0].id;
    } else {
      cameraId = cameras[0].id;
    }

    console.log(`✅ Valid Camera UUID: ${cameraId}`);
    return cameraId;
  } catch (err) {
    console.error('Error seeding camera:', err.message);
  }
}

seedCamera();
