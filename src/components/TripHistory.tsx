import type { TripHistoryItem } from '../api'

interface Props {
  trips: TripHistoryItem[]
  onSelect: (tripId: string) => void
  onBack: () => void
  loading: boolean
  onDelete?: (tripId: string) => void
}

export default function TripHistory({ trips, onSelect, onBack, loading, onDelete }: Props) {
  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-lg font-semibold text-gray-800">여행 기록</h2>
        </div>
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 underline">← 뒤로</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm border border-gray-100">
          <p className="text-base text-gray-400">아직 저장된 여행 이력이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {trips.map((trip) => (
            <button
              key={trip.tripId}
              type="button"
              onClick={() => onSelect(trip.tripId)}
              className="w-full rounded-xl bg-white p-5 shadow-sm border border-gray-100 text-left hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {trip.destination}
                    <span className="font-normal text-gray-400 ml-2 text-sm">
                      {trip.travel_month}월 · {trip.duration}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {trip.memberCount}명 · {new Date(trip.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  <span className="text-xs text-emerald-600">
                    {trip.hasResult ? '✅ 완료' : '⏳ 미완료'}
                  </span>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(trip.tripId) }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
