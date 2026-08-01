const supabase = require('../services/supabaseClient');

// list farms belonging to the authenticated user along with camera count
const getFarms = async (req, res) => {
  try {
    const userId = req.user.id;

    // query farms and aggregate count of linked cameras
    const { data: farms, error } = await supabase
      .from('farms')
      .select('*, cameras(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // transform response to include explicit camera_count field
    const formattedFarms = (farms || []).map((farm) => {
      const cameraCount = farm.cameras && farm.cameras[0] ? farm.cameras[0].count : 0;
      const { cameras, ...farmData } = farm;
      return {
        ...farmData,
        camera_count: cameraCount,
      };
    });

    return res.status(200).json({ data: formattedFarms });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch farms: ${err.message}` });
  }
};

// create a new farm tied to the authenticated user
const createFarm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'farm name is required' });
    }

    const { data: farm, error } = await supabase
      .from('farms')
      .insert([
        {
          user_id: userId,
          name,
          location: location || '',
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ data: farm });
  } catch (err) {
    return res.status(500).json({ error: `failed to create farm: ${err.message}` });
  }
};

module.exports = {
  getFarms,
  createFarm,
};
