interface Props {
  name: string
  age: number
  items: string[]
  index: number
  conditions?: string[]
}

const AVATARS = ['🦊', '🐼', '🐨', '🦁', '🐰', '🐱', '🐶', '🐸']

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  wheelchair: { label: '휠체어/유모차', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  chronic: { label: '만성질환', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  pregnant: { label: '임산부', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  infant: { label: '영유아 동반', color: 'bg-purple-50 text-purple-700 border-purple-100' },
}

export default function TravelerCard({ name, age, items, index, conditions }: Props) {
  const avatar = AVATARS[index % AVATARS.length]

  const conditionTags = (conditions || []).filter((c) => CONDITION_LABELS[c])

  return (
    <div className="animate-scale-in rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-2 ring-emerald-100">
          {avatar}
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-800">{name}</h3>
          <p className="text-xs text-gray-400">{age}세</p>
        </div>
      </div>

      {/* Conditions */}
      {conditionTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {conditionTags.map((c) => {
            const info = CONDITION_LABELS[c]
            return (
              <span key={c} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${info.color}`}>
                {info.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Items */}
      <div className="border-t border-gray-50 pt-3">
        <p className="text-[11px] font-medium text-gray-400 mb-2">준비물 · {items.length}개</p>
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 6).map((item) => {
            const isMedicine = item.startsWith('💊')
            const display = isMedicine ? item.replace('💊 ', '') : item
            return (
              <span key={item} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                isMedicine
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}>
                {isMedicine ? '💊' : '•'} {display}
              </span>
            )
          })}
          {items.length > 6 && (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-400 border border-gray-100">
              +{items.length - 6}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
