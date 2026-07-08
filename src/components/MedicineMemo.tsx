import { useState } from 'react'

interface MemberMeta {
  memberId: number
  label: string
}

interface Props {
  memberMetas: MemberMeta[]
  onSave: (memberId: number, memberLabel: string, note: string) => void
}

export default function MedicineMemo({ memberMetas, onSave }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState(memberMetas[0]?.memberId ?? 0)
  const [note, setNote] = useState('')

  const selected = memberMetas.find((m) => m.memberId === selectedMemberId)

  const handleSave = () => {
    if (!note.trim() || !selected) return
    onSave(selected.memberId, selected.label, note.trim())
    setNote('')
  }

  if (memberMetas.length === 0) return null

  return (
    <div className="mt-8 animate-fade-in">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3 className="text-base font-semibold text-gray-800">약 메모</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">대상 여행자를 선택하고 복용 약 정보를 입력하면 체크리스트에 표시됩니다.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">대상 여행자</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm"
            >
              {memberMetas.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">복용 메모</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 혈압약 아침 식사 후 1번"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!note.trim()}
            className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm text-white font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              저장
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}