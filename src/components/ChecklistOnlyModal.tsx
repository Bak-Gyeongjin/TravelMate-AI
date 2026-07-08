import ChecklistSection from './ChecklistSection'

interface Props {
  data: Record<string, string[]>
  checkedItems: Set<string>
  onToggle: (key: string) => void
  onSave: () => void
  totalItems: number
  checkedCount: number
  onClose: () => void
}

export default function ChecklistOnlyModal({ data, checkedItems, onToggle, onSave, totalItems, checkedCount, onClose }: Props) {
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-6 pb-12 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-5xl mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl bg-white px-6 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h2 className="text-base font-bold text-gray-800">준비물 체크리스트</h2>
            <span className="text-xs text-gray-400 ml-1">({checkedCount}/{totalItems})</span>
          </div>
          <div className="flex items-center gap-4">
            {totalItems > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-emerald-600 tabular-nums">{progress}%</span>
              </div>
            )}
            <button type="button" onClick={onClose} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              닫기
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-b-xl bg-gray-50 px-6 pb-8">
          <ChecklistSection data={data} checkedItems={checkedItems} onToggle={onToggle} onSave={onSave} />
        </div>
      </div>
    </div>
  )
}
