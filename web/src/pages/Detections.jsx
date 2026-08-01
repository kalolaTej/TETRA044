import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Calendar, Camera, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

const MOCK_HISTORY_DETECTIONS = [
  {
    id: 'det_101',
    animal: 'cow',
    confidence: 95,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.cow
  },
  {
    id: 'det_102',
    animal: 'dog',
    confidence: 89,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.dog
  },
  {
    id: 'det_103',
    animal: 'bear',
    confidence: 92,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.bear
  },
  {
    id: 'det_104',
    animal: 'pig',
    confidence: 87,
    camera_id: 'cam_03',
    camera_name: 'East Livestock Barn',
    zone: 'East Barn',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.pig
  },
  {
    id: 'det_105',
    animal: 'horse',
    confidence: 96,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.horse
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
    <div className="space-y-8">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Detection History</h1>
          <p className="text-base text-stone-600 mt-1.5 font-medium">Review, search, and audit past animal intrusion logs.</p>
        </div>

        <button
          onClick={() => {
            setPage(1)
            fetchDetections()
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={16} />
          <span>Reload logs</span>
        </button>
      </div>

      {/* filters toolbar */}
      <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Camera size={16} /> Camera
          </label>
          <select
            value={cameraFilter}
            onChange={(e) => {
              setCameraFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-sm font-medium bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All">All Cameras</option>
            <option value="cam_01">North Field Cam (cam_01)</option>
            <option value="cam_02">South Perimeter (cam_02)</option>
            <option value="cam_03">East Barn Cam (cam_03)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Filter size={16} /> Target Animal
          </label>
          <select
            value={animalFilter}
            onChange={(e) => {
              setAnimalFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-sm font-medium bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All">All Animals</option>
            <option value="cow">Cow</option>
            <option value="dog">Dog</option>
            <option value="bear">Bear</option>
            <option value="pig">Pig</option>
            <option value="horse">Horse</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Calendar size={16} /> Time Window
          </label>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="w-full text-sm font-medium bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today Only</option>
          </select>
        </div>
      </div>

      {/* detection logs table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-stone-200/70 rounded-2xl animate-shimmer"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#fcfbf7] border border-stone-300/80 rounded-2xl shadow-xs">
          <p className="text-base font-semibold text-stone-800">No detections matched your selected filters.</p>
          <button
            onClick={() => {
              setCameraFilter('All')
              setAnimalFilter('All')
              setDateRangeFilter('All Time')
            }}
            className="mt-4 text-sm text-amber-800 hover:underline font-bold"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-800">
              <thead className="bg-stone-200/60 border-b border-stone-300 text-stone-700 font-bold">
                <tr>
                  <th className="p-4 pl-6">Snapshot</th>
                  <th className="p-4">Animal</th>
                  <th className="p-4">Camera / Zone</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {filteredItems.map((item) => {
                  const imgSrc = getAnimalImage(item.animal, item.image_url)
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 pl-6">
                        <img
                          src={imgSrc}
                          alt={item.animal}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-lg border border-stone-300 shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.src = ANIMAL_IMAGES.cow
                          }}
                        />
                      </td>
                      <td className="p-4 font-bold text-stone-900 capitalize text-base">
                        {item.animal}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-stone-900 block text-sm">{item.zone || item.camera_name}</span>
                        <span className="block text-xs text-stone-500 font-medium">{item.camera_id}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 rounded-md bg-amber-100 text-amber-950 font-bold text-xs">
                          {item.confidence}%
                        </span>
                      </td>
                      <td className="p-4 text-stone-600 font-medium whitespace-nowrap text-xs">
                        {new Date(item.created_at || Date.now()).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Link
                          to={`/detections/${item.id}`}
                          className="inline-flex items-center gap-1 text-stone-800 hover:text-amber-800 font-bold text-sm"
                        >
                          <span>Details</span>
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-5 border-t border-stone-300 text-center bg-[#fcfbf7]">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
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
