import { Download, FileBarChart, Calendar } from 'lucide-react'
import AnalyticsCharts from '../components/AnalyticsCharts'

export default function Reports() {
  const handleExport = (format) => {
    alert(`Exporting Wildlife Intrusion Summary Report in ${format.toUpperCase()} format...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">System Performance & Reports</h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">Export audit summaries, monthly trends, and camera operational analytics.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold transition-colors shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8FAF5A] hover:bg-[#6B8E23] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <FileBarChart size={14} />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      <AnalyticsCharts />

      {/* camera telemetry summary table */}
      <div className="card-base p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#2F2F2F]">Camera Hardware Health Audit</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2F2F2F]">
            <thead className="bg-[#FAFBF8] border-b border-[#E5E7EB] text-[#666666] font-bold">
              <tr>
                <th className="p-3">Camera Node</th>
                <th className="p-3">Zone Location</th>
                <th className="p-3">Uptime Rate</th>
                <th className="p-3">Inference Accuracy</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white font-medium">
              <tr>
                <td className="p-3 font-bold">North Field Cam (cam_01)</td>
                <td className="p-3">North Field</td>
                <td className="p-3">99.8%</td>
                <td className="p-[#2F2F2F] p-3 font-bold">96.4%</td>
                <td className="p-3"><span className="text-[#059669] font-bold">Optimal</span></td>
              </tr>
              <tr>
                <td className="p-3 font-bold">South Perimeter (cam_02)</td>
                <td className="p-3">South Gate</td>
                <td className="p-3">99.5%</td>
                <td className="p-[#2F2F2F] p-3 font-bold">94.8%</td>
                <td className="p-3"><span className="text-[#059669] font-bold">Optimal</span></td>
              </tr>
              <tr>
                <td className="p-3 font-bold">East Barn Cam (cam_03)</td>
                <td className="p-3">East Barn</td>
                <td className="p-3">82.1%</td>
                <td className="p-[#2F2F2F] p-3 font-bold">91.2%</td>
                <td className="p-3"><span className="text-[#D97706] font-bold">Maintenance Req</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
