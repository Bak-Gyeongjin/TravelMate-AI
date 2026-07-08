import TravelerCard from './TravelerCard'

interface Props {
  checklists: Record<string, string[]>
  metaMap: Record<string, { age: number; conditions: string[] }>
}

export default function ResultView({ checklists, metaMap }: Props) {
  const entries = Object.entries(checklists)
  const travelerEntries = entries.filter(([k]) => k !== '공통')

  if (travelerEntries.length === 0) return null

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">여행자 프로필</h2>
          <p className="text-xs text-gray-400">여행자별 맞춤 준비물과 특이사항</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {travelerEntries.map(([person, items], i) => {
          const meta = metaMap[person]
          return (
            <TravelerCard
              key={person}
              name={person}
              age={meta?.age ?? 0}
              items={items}
              index={i}
              conditions={meta?.conditions}
            />
          )
        })}
      </div>
    </div>
  )
}
