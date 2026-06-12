import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Loader2, Bot } from 'lucide-react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#4a4a4a]">
          <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}
