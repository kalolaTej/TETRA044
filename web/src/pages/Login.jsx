import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.')
      return
    }

    try {
      setSubmitting(true)
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12 bg-[#FAFBF8]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm">
        <div className="mb-6 text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#8FAF5A] flex items-center justify-center text-white mx-auto shadow-xs">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Sign in to WildGuard AI</h1>
          <p className="text-xs text-[#666666] font-medium">Enter your credentials to access the wildlife intrusion dashboard</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@wildguard.ai"
              className="w-full px-3.5 py-2 text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg text-[#2F2F2F] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2F2F2F] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2 text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg text-[#2F2F2F] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#2F2F2F] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#8FAF5A] hover:bg-[#6B8E23] disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs mt-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs font-medium text-[#666666] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#6B8E23] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
