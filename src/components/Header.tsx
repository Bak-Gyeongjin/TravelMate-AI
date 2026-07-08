interface Props {
  onHistoryClick?: () => void
  showBadges?: boolean
}

const FEATURES = [
  { label: 'AI 준비물 추천', icon: '✨' },
  { label: '실시간 날씨', icon: '🌤️' },
  { label: '주변 응급시설', icon: '🏥' },
  { label: '여행 체크리스트', icon: '✅' },
  { label: 'PDF 저장', icon: '📄' },
  { label: '여행 기록', icon: '💾' },
]

export default function Header({ onHistoryClick, showBadges }: Props) {
  return (
    <header>
      {/* Hero Section */}
      <div className="relative bg-hero-gradient px-6 pb-12 pt-8">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-24 -translate-y-24 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-12 translate-y-12 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <span className="text-sm font-medium text-white/80">TravelMate AI</span>
            </div>
            <div className="flex items-center gap-2">
              {onHistoryClick && (
                <button type="button" onClick={onHistoryClick} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  여행 기록
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">TravelMate AI</h1>
            <p className="mt-2 text-base text-emerald-200">Your AI Travel Companion</p>
            <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-lg mx-auto">
              누구나 자유롭고 안전하게 여행할 수 있도록 AI가 함께합니다.
            </p>
          </div>

          {showBadges && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {FEATURES.map((f, i) => (
                <span key={f.label} className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm animate-slide-up stagger-${i + 1}`}>
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}