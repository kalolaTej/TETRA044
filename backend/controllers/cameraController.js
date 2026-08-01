const supabase = require('../services/supabaseClient');

// in-memory heartbeat tracker for real-time camera online/offline status
const liveCameraHeartbeats = new Map();

// receive real-time camera heartbeat from detect.py engine
const updateCameraHeartbeat = async (req, res) => {
  try {
    const { camera_id, status } = req.body;
    if (!camera_id) {
      return res.status(400).json({ error: 'camera_id is required' });
    }

    if (status === false || status === 'offline') {
      liveCameraHeartbeats.delete(camera_id);
    } else {
      liveCameraHeartbeats.set(camera_id, Date.now());
    }

    return res.status(200).json({ success: true, camera_id, status: liveCameraHeartbeats.has(camera_id) ? 'online' : 'offline' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// list cameras with real-time live status based on active heartbeats
const getCameras = async (req, res) => {
  try {
    const { data: cameras, error: cameraError } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: false });

    if (cameraError) {
      return res.status(500).json({ error: cameraError.message });
    }

    const cameraList = cameras || [];
    const now = Date.now();

    const enrichedCameras = cameraList.map((cam) => {
      const lastHeartbeat = liveCameraHeartbeats.get(cam.id);
      
      // camera is online only if a heartbeat was received within the last 8 seconds
      const isOnline = Boolean(lastHeartbeat && (now - lastHeartbeat < 8000));

      return {
        ...cam,
        status: isOnline ? 'online' : 'offline',
        last_ping: isOnline ? `Live now (${new Date(lastHeartbeat).toLocaleTimeString()})` : 'Offline (no active signal)',
        fps: isOnline ? 30 : 0,
      };
    });

    return res.status(200).json({ data: enrichedCameras });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch cameras: ${err.message}` });
  }
};

const createCamera = async (req, res) => {
  try {
    const { farm_id, name, zone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { data: camera, error: cameraError } = await supabase
      .from('cameras')
      .insert([{ farm_id: farm_id || null, name, zone: zone || 'North Field' }])
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

const updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: camera, error: updateError } = await supabase
      .from('cameras')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !camera) {
      return res.status(404).json({ error: 'camera not found' });
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
  updateCameraHeartbeat,
  liveCameraHeartbeats,
};
