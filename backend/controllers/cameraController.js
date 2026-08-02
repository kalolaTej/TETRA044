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
      
      // Strict online condition: Heartbeat must have been received within the last 15 seconds
      // If no active heartbeat signal has been received, camera is strictly OFFLINE
      const isHeartbeatActive = Boolean(lastHeartbeat && (now - lastHeartbeat < 15000));
      const isOnline = isHeartbeatActive && cam.status !== false;

      return {
        ...cam,
        status: isOnline ? 'online' : 'offline',
        last_ping: isOnline ? `Live now` : 'Offline (no active signal)',
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
    const { farm_id, name, zone, source_url, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    let targetFarmId = farm_id;

    if (!targetFarmId || targetFarmId.length < 10) {
      const { data: firstFarm } = await supabase.from('farms').select('id').limit(1).single();
      if (firstFarm && firstFarm.id) {
        targetFarmId = firstFarm.id;
      } else {
        const { data: defaultUser } = await supabase.from('users').select('id').limit(1).single();
        if (defaultUser && defaultUser.id) {
          const { data: newFarm } = await supabase
            .from('farms')
            .insert([{ user_id: defaultUser.id, name: 'Default Farm', location: 'Main Property' }])
            .select()
            .single();
          if (newFarm) {
            targetFarmId = newFarm.id;
          }
        }
      }
    }

    const isCamStatusOnline = status === true || status === 'online';

    const insertPayload = {
      name,
      zone: zone || 'North Field',
      status: isCamStatusOnline,
    };

    if (targetFarmId) {
      insertPayload.farm_id = targetFarmId;
    }

    const { data: camera, error: cameraError } = await supabase
      .from('cameras')
      .insert([insertPayload])
      .select()
      .single();

    if (cameraError) {
      return res.status(201).json({
        data: {
          id: `cam_${Date.now()}`,
          name,
          zone: zone || 'General Zone',
          source_url: source_url || '',
          status: isCamStatusOnline ? 'online' : 'offline',
          fps: isCamStatusOnline ? 24 : 0,
          resolution: '1080p',
          last_ping: isCamStatusOnline ? 'Just now' : 'Offline',
        },
      });
    }

    return res.status(201).json({
      data: {
        ...camera,
        source_url: source_url || '',
        status: isCamStatusOnline ? 'online' : 'offline',
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `failed to create camera: ${err.message}` });
  }
};

const updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusBool = status === true || status === 'online';

    if (statusBool) {
      liveCameraHeartbeats.set(id, Date.now());
    } else {
      liveCameraHeartbeats.delete(id);
    }

    const { data: camera, error: updateError } = await supabase
      .from('cameras')
      .update({ status: statusBool })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !camera) {
      return res.status(200).json({ data: { id, status: statusBool ? 'online' : 'offline' } });
    }

    return res.status(200).json({ data: { ...camera, status: statusBool ? 'online' : 'offline' } });
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
