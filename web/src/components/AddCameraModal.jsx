import { useState, useEffect } from 'react'
import { X, Camera, MapPin, Video, Building, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AddCameraModal({ isOpen, onClose, onCameraAdded, farms = [] }) {
  const { session } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    farm_id: '',
    zone: '',
    source_url: '',
    status: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (farms && farms.length > 0 && !formData.farm_id) {
      setFormData((prev) => ({ ...prev, farm_id: farms[0].id }))
    }
  }, [farms, formData.farm_id])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Camera Name is required')
      return
    }
    if (!formData.farm_id) {
      setError('Please select or enter a Farm ID')
      return
    }

    setLoading(true)

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`${backendUrl}/api/cameras`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          farm_id: formData.farm_id,
          zone: formData.zone.trim() || 'General Zone',
          source_url: formData.source_url.trim(),
          status: formData.status,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const createdCamera = data?.data || data?.camera || {
          id: `cam_${Date.now()}`,
          name: formData.name.trim(),
          farm_id: formData.farm_id,
          zone: formData.zone.trim() || 'General Zone',
          source_url: formData.source_url.trim(),
          status: formData.status ? 'online' : 'offline',
          fps: 24,
          resolution: '1080p',
          last_ping: 'Just now',
        }

        if (onCameraAdded) {
          onCameraAdded(createdCamera)
        }

        // reset form and close
        setFormData({
          name: '',
          farm_id: farms[0]?.id || '',
          zone: '',
          source_url: '',
          status: true,
        })
        onClose()
      } else {
        setError(data?.error || 'Failed to register camera')
      }
    } catch (err) {
      setError('Server unreachable. Camera added to local view.')
      // fallback local update
      if (onCameraAdded) {
        onCameraAdded({
          id: `cam_${Date.now()}`,
          name: formData.name.trim(),
          farm_id: formData.farm_id,
          zone: formData.zone.trim() || 'General Zone',
          source_url: formData.source_url.trim(),
          status: formData.status ? 'online' : 'offline',
          fps: 30,
          resolution: '1080p',
          last_ping: 'Just now',
        })
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#E5E7EB] flex flex-col">
        {/* modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFBF8]">
          <div className="flex items-center gap-2 text-[#2F2F2F]">
            <div className="p-2 rounded-lg bg-[#8FAF5A]/15 text-[#8FAF5A]">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Add New IP Web Camera</h2>
              <p className="text-xs text-[#666666]">Configure RTSP / HTTP stream & zone assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666666] hover:bg-stone-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* modal body / form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* camera name */}
          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5 flex items-center gap-1.5">
              <Camera size={14} className="text-[#8FAF5A]" /> Camera Name *
            </label>
            <input
              type="text"
              placeholder="e.g. North Gate Perimeter Cam"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-stone-50/50 focus:bg-white focus:border-[#8FAF5A] focus:ring-1 focus:ring-[#8FAF5A] outline-none font-medium transition-all"
              required
            />
          </div>

          {/* farm selection */}
          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5 flex items-center gap-1.5">
              <Building size={14} className="text-[#8FAF5A]" /> Target Farm *
            </label>
            {farms && farms.length > 0 ? (
              <select
                value={formData.farm_id}
                onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-stone-50/50 focus:bg-white focus:border-[#8FAF5A] outline-none font-medium transition-all"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location || 'Farm'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter Farm ID (e.g. farm_01)"
                value={formData.farm_id}
                onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-stone-50/50 focus:bg-white focus:border-[#8FAF5A] outline-none font-medium transition-all"
                required
              />
            )}
          </div>

          {/* zone name */}
          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#8FAF5A]" /> Zone / Location
            </label>
            <input
              type="text"
              placeholder="e.g. North Field, Livestock Barn 2"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-stone-50/50 focus:bg-white focus:border-[#8FAF5A] outline-none font-medium transition-all"
            />
          </div>

          {/* RTSP / IP stream URL */}
          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5 flex items-center gap-1.5">
              <Video size={14} className="text-[#8FAF5A]" /> RTSP / IP Web Camera URL
            </label>
            <input
              type="text"
              placeholder="rtsp://admin:pass@192.168.1.101:554/stream1 or http://"
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-stone-50/50 focus:bg-white focus:border-[#8FAF5A] outline-none font-mono transition-all text-[#2F2F2F]"
            />
            <p className="text-[11px] text-[#8A8A8A] mt-1">
              Supports RTSP stream, IP Webcam app HTTP URL (e.g. <code>http://192.168.1.50:8080/video</code>), or webcam index.
            </p>
          </div>

          {/* status toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
            <div>
              <span className="text-xs font-bold text-[#2F2F2F] block">Camera Status</span>
              <span className="text-[11px] text-[#666666]">Enable stream monitoring immediately</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8FAF5A]"></div>
            </label>
          </div>

          {/* submit action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#666666] hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8FAF5A] hover:bg-[#7A9949] shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Add Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
