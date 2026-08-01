const supabase = require('../services/supabaseClient');

// list cameras belonging to logged-in user's farms
const getCameras = async (req, res) => {
  try {
    const userId = req.user.id;

    // fetch farms belonging to the user
    const { data: userFarms, error: farmError } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', userId);

    if (farmError) {
      return res.status(500).json({ error: farmError.message });
    }

    if (!userFarms || userFarms.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const farmIds = userFarms.map((f) => f.id);

    // fetch cameras linked to user's farms
    const { data: cameras, error: cameraError } = await supabase
      .from('cameras')
      .select('*')
      .in('farm_id', farmIds)
      .order('created_at', { ascending: false });

    if (cameraError) {
      return res.status(500).json({ error: cameraError.message });
    }

    return res.status(200).json({ data: cameras || [] });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch cameras: ${err.message}` });
  }
};

// create a new camera under a farm owned by the logged-in user
const createCamera = async (req, res) => {
  try {
    const userId = req.user.id;
    const { farm_id, name, zone } = req.body;

    if (!farm_id || !name) {
      return res.status(400).json({ error: 'farm_id and name are required' });
    }

    // verify farm ownership
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('id')
      .eq('id', farm_id)
      .eq('user_id', userId)
      .single();

    if (farmError || !farm) {
      return res.status(403).json({ error: 'farm not found or access denied' });
    }

    const { data: camera, error: cameraError } = await supabase
      .from('cameras')
      .insert([{ farm_id, name, zone: zone || '' }])
      .select()
      .single();

    if (cameraError) {
      return res.status(500).json({ error: cameraError.message });
    }

    return res.status(201).json({ data: camera });
  } catch (err) {
    return res.status(500).json({ error: `failed to create camera: ${err.message}` });
  }
};

// update camera online/offline status
const updateCameraStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: 'status must be a boolean value (true or false)' });
    }

    // fetch user's farm ids for authorization check
    const { data: userFarms } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', userId);

    if (!userFarms || userFarms.length === 0) {
      return res.status(403).json({ error: 'camera not found or access denied' });
    }

    const farmIds = userFarms.map((f) => f.id);

    const { data: camera, error: updateError } = await supabase
      .from('cameras')
      .update({ status })
      .eq('id', id)
      .in('farm_id', farmIds)
      .select()
      .single();

    if (updateError || !camera) {
      return res.status(404).json({ error: 'camera not found or access denied' });
    }

    return res.status(200).json({ data: camera });
  } catch (err) {
    return res.status(500).json({ error: `failed to update camera status: ${err.message}` });
  }
};

module.exports = {
  getCameras,
  createCamera,
  updateCameraStatus,
};
