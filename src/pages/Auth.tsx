import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { Mark } from '../components/Logo'

type Mode = 'signin' | 'signup' | 'reset'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/app/dashboard')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app/settings`,
        })
        if (error) throw error
        setSuccess('Password reset email sent.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mark className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Tracque</span>
        </div>

        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1">
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h1>
          <p className="text-sm text-[#888] mb-6">
            {mode === 'signin' ? 'Sign in to your Tracque account' :
             mode === 'signup' ? 'Start tracking your AI visibility' :
             "We'll send you a reset link"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#4a4a4a] block mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full text-sm border border-[#E8E4DF] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] bg-white transition-colors"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="text-xs font-medium text-[#4a4a4a] block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full text-sm border border-[#E8E4DF] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] bg-white transition-colors"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Mode switchers */}
          <div className="mt-5 space-y-2 text-center">
            {mode === 'signin' && (
              <>
                <button onClick={() => setMode('reset')} className="text-xs text-[#888] hover:text-[#1a1a1a] block w-full">
                  Forgot password?
                </button>
                <p className="text-xs text-[#888]">
                  No account?{' '}
                  <button onClick={() => setMode('signup')} className="text-[#1a1a1a] font-medium hover:underline">
                    Sign up free
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-xs text-[#888]">
                Already have an account?{' '}
                <button onClick={() => setMode('signin')} className="text-[#1a1a1a] font-medium hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button onClick={() => setMode('signin')} className="text-xs text-[#888] hover:text-[#1a1a1a]">
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#aaa] mt-4">
          By signing up you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
