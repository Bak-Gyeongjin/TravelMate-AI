interface Props {
  data: Record<string, string[]>
  checkedItems: Set<string>
  onToggle: (key: string) => void
  onSave: () => void
}

export default function ChecklistSection({ data, checkedItems, onToggle, onSave }: Props) {
  const entries = Object.entries(data)
  const commonItems = data['공통']
  const travelerEntries = entries.filter(([k]) => k !== '공통')

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      {/* Common Items Section */}
      {commonItems && commonItems.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">공통 준비물</h3>
              <p className="text-xs text-gray-400">모든 여행자가 함께 챙겨요</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commonItems.map((item) => {
              const key = `공통:${item}`
              return (
                <label key={item} className="flex items-center gap-2.5 cursor-pointer group py-1 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(key)}
                    onChange={() => onToggle(key)}
                    className="accent-emerald-500 w-4.5 h-4.5 shrink-0"
                  />
                  <span className={`text-sm ${checkedItems.has(key) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Traveler Checklists */}
      {travelerEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">여행자별 체크리스트</h3>
              <p className="text-xs text-gray-400">각자 챙겨야 할 준비물</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {travelerEntries.map(([person, items]) => (
              <div key={person} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {person}
                </h4>
                <ul className="space-y-1.5">
                  {items.map((item) => {
                    const isMedicine = item.startsWith('💊')
                    const display = isMedicine ? item.replace('💊 ', '') : item
                    const key = `${person}:${display}`
                    return (
                      <li key={item}>
                        <label className="flex items-center gap-2.5 cursor-pointer group py-1 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={checkedItems.has(key)}
                            onChange={() => onToggle(key)}
                            className="accent-emerald-500 w-4.5 h-4.5 shrink-0"
                          />
                          <span
                            className={`text-sm ${
                              checkedItems.has(key)
                                ? 'line-through text-gray-400'
                                : isMedicine
                                  ? 'text-blue-700 font-medium'
                                  : 'text-gray-700'
                            }`}
                          >
                            {isMedicine && <span className="mr-1">💊</span>}
                            {display}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={checkedItems.size === 0}
        className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm text-white font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          체크 상태 저장
        </span>
      </button>
    </div>
  )
}
