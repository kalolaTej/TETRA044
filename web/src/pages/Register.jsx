import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
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
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12">
      <div className="w-full max-w-md bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-8 shadow-xs">
        <div className="mb-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white mx-auto shadow-sm">
            <ShieldAlert size={26} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Create your account</h1>
          <p className="text-base text-stone-600 font-medium">Join to monitor animal intrusion alerts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 text-base font-medium bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 text-base font-medium bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-4 pr-12 py-3 text-base font-medium bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {password && (
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden flex gap-1.5 p-0.5">
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-stone-600 font-medium">
                  <span>Password strength</span>
                  <span className="font-bold text-stone-900">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs mt-2"
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-stone-600 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-stone-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
