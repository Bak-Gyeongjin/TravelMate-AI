import { useState, type FormEvent } from 'react'
import { useAuth } from '../AuthContext'

export default function LoginPage() {
  const { login, register, loading, user, logout } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-700 mb-2">안녕하세요, <strong>{user.username}</strong>님</p>
          <p className="text-xs text-gray-400 mb-6">TravelMate에 오신 걸 환영합니다</p>
          <button onClick={logout} className="text-sm text-emerald-600 hover:text-emerald-700 underline">로그아웃</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">TravelMate AI</h1>
          <p className="text-sm text-gray-400 mt-1">로그인하여 여행을 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">아이디</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              placeholder="아이디 입력" required minLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">비밀번호</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              placeholder="비밀번호 입력" required minLength={4}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {mode === 'login' ? (
              <>계정이 없으신가요? <button type="button" onClick={() => { setMode('register'); setError(null) }} className="text-emerald-600 underline">회원가입</button></>
            ) : (
              <>이미 계정이 있으신가요? <button type="button" onClick={() => { setMode('login'); setError(null) }} className="text-emerald-600 underline">로그인</button></>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
