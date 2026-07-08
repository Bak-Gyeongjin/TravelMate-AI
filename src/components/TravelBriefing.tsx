export interface BriefingData {
  weather: { temp: number; description: string; icon: string } | null
  hospitals: Array<{ name: string; address: string; phone: string; note: string }>
  pharmacies: Array<{ name: string; address: string; phone: string; note: string }>
  riskLevel: '낮음' | '보통' | '높음'
}

interface Props {
  briefing: BriefingData | null
  destination?: string
  loading?: boolean
  safetyBriefing: string
}

const weatherIcons: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌦️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
}

function getIcon(icon: string) {
  return weatherIcons[icon] || '🌤️'
}

export default function TravelBriefing({ briefing, destination, loading, safetyBriefing }: Props) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 bg-emerald-200/50 rounded mb-3" />
        <div className="h-16 w-full bg-gray-100 rounded mb-4" />
        <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
        <div className="h-12 w-full bg-gray-100 rounded" />
      </div>
    )
  }

  if (!briefing) return null

  return (
    <div className="animate-slide-up rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">AI 안전 브리핑</h2>
          <p className="text-xs text-gray-400">TravelMate가 분석한 {destination || '여행'} 안전 정보</p>
        </div>
      </div>

      {/* Safety Briefing Text */}
      {safetyBriefing && (
        <div className="mb-5 rounded-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0 mt-0.5">🤖</span>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{safetyBriefing}</p>
          </div>
        </div>
      )}

      {/* Weather + Risk */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        {briefing.weather && (
          <div className="rounded-lg bg-gradient-to-br from-gray-50 to-white p-3 border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">날씨</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{getIcon(briefing.weather.icon)}</span>
              <div>
                <span className="text-lg font-bold text-gray-800">{briefing.weather.temp}°</span>
                <p className="text-[11px] text-gray-500">{briefing.weather.description}</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg bg-gradient-to-br from-gray-50 to-white p-3 border border-gray-100">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">위험도</span>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              briefing.riskLevel === '낮음' ? 'bg-green-50 text-green-700' :
              briefing.riskLevel === '보통' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                briefing.riskLevel === '낮음' ? 'bg-green-500' :
                briefing.riskLevel === '보통' ? 'bg-amber-500' :
                'bg-red-500'
              }`} />
              {briefing.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* 대표 응급의료기관 */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🏥</span>
          <h3 className="text-sm font-bold text-gray-800">여행 전 참고하면 좋은 의료기관</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">TravelMate가 {destination || '여행지'}의 대표 응급의료기관을 안내해드려요. 여행 전에 한 번 확인해두면 안심할 수 있어요.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Hospitals */}
          {briefing.hospitals.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">🚑 대표 응급실</span>
              <div className="mt-2 space-y-2">
                {briefing.hospitals.map((h, i) => (
                  <div key={i} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                    <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                    <p className="text-xs text-gray-500">{h.address}</p>
                    {h.phone && (
                      <a href={`tel:${h.phone.replace(/-/g, '')}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        {h.phone}
                      </a>
                    )}
                    {h.note && <p className="text-xs text-gray-400 mt-1 italic">{h.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pharmacies */}
          {briefing.pharmacies.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">💊 대표 약국</span>
              <div className="mt-2 space-y-2">
                {briefing.pharmacies.map((p, i) => (
                  <div key={i} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.address}</p>
                    {p.phone && (
                      <a href={`tel:${p.phone.replace(/-/g, '')}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        {p.phone}
                      </a>
                    )}
                    {p.note && <p className="text-xs text-gray-400 mt-1 italic">{p.note}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">더 가까운 약국은 지도 앱에서 확인해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
