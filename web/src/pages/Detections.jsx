import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Calendar, Camera, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MOCK_HISTORY_DETECTIONS = [
  {
    id: 'det_101',
    animal: 'cow',
    confidence: 95,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_102',
    animal: 'dog',
    confidence: 89,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_103',
    animal: 'bear',
    confidence: 92,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_104',
    animal: 'pig',
    confidence: 87,
    camera_id: 'cam_03',
    camera_name: 'East Livestock Barn',
    zone: 'East Barn',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_105',
    animal: 'horse',
    confidence: 96,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80'
  }
]

export default function Detections() {
  const { session } = useAuth()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [cameraFilter, setCameraFilter] = useState('All')
  const [animalFilter, setAnimalFilter] = useState('All')
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10

  const fetchDetections = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
        ...(cameraFilter !== 'All' && { camera: cameraFilter }),
        ...(animalFilter !== 'All' && { animal: animalFilter })
      })

      const res = await fetch(`${backendUrl}/api/detections?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = data.detections || data
        setDetections((prev) => (page === 1 ? items : [...prev, ...items]))
        setHasMore(items.length >= limit)
      } else {
        setDetections(MOCK_HISTORY_DETECTIONS)
        setHasMore(false)
      }
    } catch {
      setDetections(MOCK_HISTORY_DETECTIONS)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [session, page, cameraFilter, animalFilter])

  useEffect(() => {
    fetchDetections()
  }, [fetchDetections])

  // local filter evaluation
  const filteredItems = detections.filter((item) => {
    if (cameraFilter !== 'All' && item.camera_id !== cameraFilter && item.camera_name !== cameraFilter) {
      return false
    }
    if (animalFilter !== 'All' && item.animal.toLowerCase() !== animalFilter.toLowerCase()) {
      return false
    }
    if (dateRangeFilter === 'Today') {
      const today = new Date().toDateString()
      return new Date(item.created_at).toDateString() === today
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Detection History</h1>
          <p className="text-sm text-stone-500 mt-1">Review, search, and audit past animal intrusion logs.</p>
        </div>

        <button
          onClick={() => {
            setPage(1)
            fetchDetections()
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Reload logs</span>
        </button>
      </div>

      {/* filters toolbar */}
      <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* camera filter */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
            <Camera size={13} /> Camera
          </label>
          <select
            value={cameraFilter}
            onChange={(e) => {
              setCameraFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All">All Cameras</option>
            <option value="cam_01">North Field Cam (cam_01)</option>
            <option value="cam_02">South Perimeter (cam_02)</option>
            <option value="cam_03">East Barn Cam (cam_03)</option>
          </select>
        </div>

        {/* animal filter */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
            <Filter size={13} /> Target Animal
          </label>
          <select
            value={animalFilter}
            onChange={(e) => {
              setAnimalFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All">All Animals</option>
            <option value="cow">Cow</option>
            <option value="dog">Dog</option>
            <option value="bear">Bear</option>
            <option value="pig">Pig</option>
            <option value="horse">Horse</option>
          </select>
        </div>

        {/* date range filter */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1 flex items-center gap-1">
            <Calendar size={13} /> Time Window
          </label>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today Only</option>
          </select>
        </div>
      </div>

      {/* detection logs table/grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-stone-200/60 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-[#faf8f5] border border-stone-200 rounded-xl">
          <p className="text-sm font-medium text-stone-600">No detections matched your selected filters.</p>
          <button
            onClick={() => {
              setCameraFilter('All')
              setAnimalFilter('All')
              setDateRangeFilter('All Time')
            }}
            className="mt-3 text-xs text-amber-700 hover:underline font-medium"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="bg-[#faf8f5] border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Snapshot</th>
                  <th className="p-3.5">Animal</th>
                  <th className="p-3.5">Camera / Zone</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3 pl-4">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=100&auto=format&fit=crop&q=80'}
                        alt={item.animal}
                        className="w-10 h-10 object-cover rounded-md border border-stone-200"
                      />
                    </td>
                    <td className="p-3 font-semibold text-stone-900 capitalize">
                      {item.animal}
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{item.zone || item.camera_name}</span>
                      <span className="block text-[11px] text-stone-400">{item.camera_id}</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 font-medium text-[11px]">
                        {item.confidence}%
                      </span>
                    </td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {new Date(item.created_at || Date.now()).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <Link
                        to={`/detections/${item.id}`}
                        className="inline-flex items-center gap-1 text-stone-700 hover:text-amber-800 font-medium"
                      >
                        <span>Details</span>
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* load more button */}
          {hasMore && (
            <div className="p-4 border-t border-stone-200 text-center bg-[#faf8f5]">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
              >
                Load more detections
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
