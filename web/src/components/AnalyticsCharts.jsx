import { useState } from 'react'
import { TrendingUp, BarChart2, PieChart, ShieldCheck } from 'lucide-react'

export default function AnalyticsCharts({ detections = [] }) {
  const [timeframe, setTimeframe] = useState('7d')

  // compute dynamic daily counts for the past 7 days from live detections array
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const daysMap = {}
  const last7Days = []

  // initialize last 7 calendar days with 0 count
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const key = d.toDateString()
    const label = dayNames[d.getDay()]
    const entry = { key, label, count: 0 }
    last7Days.push(entry)
    daysMap[key] = entry
  }

  // populate counts from live detections array
  if (Array.isArray(detections) && detections.length > 0) {
    detections.forEach((item) => {
      if (!item) return
      const dateStr = new Date(item.detected_at || item.created_at || Date.now()).toDateString()
      if (daysMap[dateStr]) {
        daysMap[dateStr].count += 1
      }
    })
  }

  // max count for proportional bar height scaling
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count))
  const weeklyData = last7Days.map((d) => ({
    day: d.label,
    count: d.count,
    height: d.count > 0 ? `${Math.max(18, Math.round((d.count / maxDayCount) * 100))}%` : '6%'
  }))

  // compute dynamic species breakdown from live detections array
  const speciesCounts = {}
  let totalDetections = 0

  if (Array.isArray(detections) && detections.length > 0) {
    detections.forEach((item) => {
      if (!item) return
      const animal = (item.animal || 'other').toLowerCase()
      speciesCounts[animal] = (speciesCounts[animal] || 0) + 1
      totalDetections += 1
    })
  }

  const animalColors = {
    cow: '#8FAF5A',
    dog: '#B7C99A',
    bear: '#6B8E23',
    pig: '#D6E0C2',
    horse: '#A3B18A'
  }

  const dynamicDistribution = totalDetections > 0
    ? Object.keys(speciesCounts).map((key) => {
        const cnt = speciesCounts[key]
        const pct = Math.round((cnt / totalDetections) * 100)
        return {
          animal: key.charAt(0).toUpperCase() + key.slice(1),
          percentage: pct,
          color: animalColors[key] || '#8FAF5A',
          count: cnt
        }
      })
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* weekly detection activity bar chart */}
      <div className="lg:col-span-2 card-base p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#6B8E23]" />
              <h3 className="text-sm font-bold text-[#2F2F2F]">Detection Activity Trend</h3>
            </div>
            <div className="flex items-center gap-1 bg-[#FAFBF8] border border-[#E5E7EB] p-1 rounded-lg text-xs">
              <button
                onClick={() => setTimeframe('7d')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  timeframe === '7d' ? 'bg-white text-[#2F2F2F] shadow-2xs' : 'text-[#666666]'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe('30d')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  timeframe === '30d' ? 'bg-white text-[#2F2F2F] shadow-2xs' : 'text-[#666666]'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
          <p className="text-xs text-[#666666]">Live intrusion events logged per calendar day across active edge nodes.</p>
        </div>

        {/* dynamic bar visualization */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-end justify-between h-44 gap-3">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-[#2F2F2F] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] shadow-2xs group-hover:border-[#8FAF5A] transition-colors">
                {item.count}
              </span>
              <div className="w-full max-w-[36px] bg-[#FAFBF8] border border-[#E5E7EB] rounded-t-lg overflow-hidden flex items-end h-full">
                <div
                  className="w-full bg-[#8FAF5A] group-hover:bg-[#6B8E23] transition-all rounded-t-lg duration-500"
                  style={{ height: item.height }}
                ></div>
              </div>
              <span className="text-xs font-bold text-[#666666]">{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* animal class breakdown card */}
      <div className="card-base p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-[#6B8E23]" />
            <h3 className="text-sm font-bold text-[#2F2F2F]">Intrusion Species Breakdown</h3>
          </div>
          <p className="text-xs text-[#666666]">Percentage distribution calculated from live detection data.</p>
        </div>

        {dynamicDistribution.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck size={32} className="mx-auto text-[#8A8A8A] opacity-60" />
            <p className="text-xs font-bold text-[#2F2F2F]">No intrusion events logged yet.</p>
            <p className="text-[11px] text-[#666666]">Species breakdown will calculate automatically on live camera detections.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {dynamicDistribution.map((item) => (
              <div key={item.animal} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#2F2F2F]">{item.animal}</span>
                  <span className="text-[#666666]">{item.count} events ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-[#FAFBF8] border border-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#666666]">
          <span>Most Frequent: <strong className="text-[#2F2F2F]">{dynamicDistribution[0]?.animal || 'None'}</strong></span>
          <span className="flex items-center gap-1 text-[#059669] font-bold">
            <TrendingUp size={14} /> Live Sync
          </span>
        </div>
      </div>
    </div>
  )
}
