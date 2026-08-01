const dotenv = require('dotenv');
dotenv.config();

const supabase = require('./services/supabaseClient');

async function cleanupDuplicates() {
  console.log('--- Cleaning Up Duplicate Data in Database ---');

  try {
    // 1. Fetch all detections
    const { data: detections, error: dErr } = await supabase
      .from('detections')
      .select('*')
      .order('detected_at', { ascending: false });

    if (dErr) {
      console.error('Error fetching detections:', dErr.message);
    } else if (detections && detections.length > 0) {
      console.log(`Total detections found: ${detections.length}`);

      const uniqueKeys = new Set();
      const duplicateIdsToDelete = [];

      for (const d of detections) {
        // Form a signature key based on camera_id, animal, confidence, and timestamp minute
        const timestampKey = new Date(d.detected_at || d.created_at).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        const key = `${d.camera_id}_${d.animal}_${d.confidence}_${timestampKey}`;

        if (uniqueKeys.has(key)) {
          duplicateIdsToDelete.push(d.id);
        } else {
          uniqueKeys.add(key);
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        console.log(`Found ${duplicateIdsToDelete.length} duplicate detection records to remove...`);
        const { error: delErr } = await supabase
          .from('detections')
          .delete()
          .in('id', duplicateIdsToDelete);

        if (delErr) {
          console.error('Failed to delete duplicate detections:', delErr.message);
        } else {
          console.log(`✅ Successfully deleted ${duplicateIdsToDelete.length} duplicate detections!`);
        }
      } else {
        console.log('✅ No duplicate detections found.');
      }
    }

    // 2. Fetch and deduplicate cameras table
    const { data: cameras, error: cErr } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: true });

    if (!cErr && cameras && cameras.length > 1) {
      const uniqueCamNames = new Set();
      const duplicateCamIds = [];

      for (const cam of cameras) {
        const camKey = `${cam.farm_id}_${cam.name.toLowerCase().trim()}`;
        if (uniqueCamNames.has(camKey)) {
          duplicateCamIds.push(cam.id);
        } else {
          uniqueCamNames.add(camKey);
        }
      }

      if (duplicateCamIds.length > 0) {
        console.log(`Found ${duplicateCamIds.length} duplicate camera records to remove...`);
        await supabase.from('cameras').delete().in('id', duplicateCamIds);
        console.log(`✅ Deleted ${duplicateCamIds.length} duplicate cameras!`);
      }
    }

    // 3. Fetch and deduplicate farms table
    const { data: farms, error: fErr } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: true });

    if (!fErr && farms && farms.length > 1) {
      const uniqueFarmNames = new Set();
      const duplicateFarmIds = [];

      for (const farm of farms) {
        const farmKey = `${farm.user_id}_${farm.name.toLowerCase().trim()}`;
        if (uniqueFarmNames.has(farmKey)) {
          duplicateFarmIds.push(farm.id);
        } else {
          uniqueFarmNames.add(farmKey);
        }
      }

      if (duplicateFarmIds.length > 0) {
        console.log(`Found ${duplicateFarmIds.length} duplicate farm records to remove...`);
        await supabase.from('farms').delete().in('id', duplicateFarmIds);
        console.log(`✅ Deleted ${duplicateFarmIds.length} duplicate farms!`);
      }
    }

    console.log('--- Cleanup Complete ---');
  } catch (err) {
    console.error('Exception during cleanup:', err.message);
  }
}

cleanupDuplicates();
