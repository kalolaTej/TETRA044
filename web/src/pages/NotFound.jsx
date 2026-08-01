import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-500 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-400 mb-4">The requested intrusion route does not exist.</p>
      <Link to="/dashboard" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500">
        Return to Dashboard
      </Link>
    </div>
  )
}
