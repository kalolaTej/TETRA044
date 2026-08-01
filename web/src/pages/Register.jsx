import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  // calculate password strength score (0 to 3)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-stone-200' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 10 && /\d/.test(pass)) score += 1
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-amber-400' }
    if (score === 2) return { score: 2, label: 'Moderate', color: 'bg-amber-600' }
    return { score: 3, label: 'Strong', color: 'bg-emerald-600' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setSubmitting(true)
      await register(name.trim(), email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="w-full max-w-md bg-[#faf8f5] border border-stone-200 rounded-xl p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-stone-500 mt-1">Join to monitor animal intrusion alerts</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-3.5 pr-10 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* password strength meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-stone-500">
                  <span>Password strength</span>
                  <span className="font-medium text-stone-700">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-stone-800 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
