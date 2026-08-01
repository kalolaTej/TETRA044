import { useParams } from 'react-router-dom'

export default function DetectionDetail() {
  const { id } = useParams()

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-emerald-400">Detection Detail ({id})</h1>
    </div>
  )
}
