import { useState, useRef } from 'react'

const DURATIONS = ['당일치기', '1박 2일', '2박 3일', '3박 4일 이상'] as const
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] as const

export interface Member {
  id: number
  name: string
  age: number
  notes: string[]
}

export interface TravelInfo {
  destination: string
  duration: string
  month: string
  transport: string
}

interface Props {
  onGenerate: (members: Member[], travel: TravelInfo) => void
  loading: boolean
  initialMembers?: Member[]
  initialTravel?: TravelInfo
  editLabel?: string
}

export default function FamilyForm({ onGenerate, loading, initialMembers, initialTravel, editLabel }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers || [
    { id: 1, name: '김민수', age: 30, notes: [] },
  ])
  const [travel, setTravel] = useState<TravelInfo>(initialTravel || {
    destination: '제주도',
    duration: '2박 3일',
    month: '8',
    transport: 'car',
  })

  const membersRef = useRef(members)
  membersRef.current = members
  const travelRef = useRef(travel)
  travelRef.current = travel

  const addMember = () => {
    const nextId = membersRef.current.length > 0
      ? Math.max(...membersRef.current.map((m) => m.id)) + 1
      : 1
    const next = [...membersRef.current, { id: nextId, name: '', age: 30, notes: [] }]
    setMembers(next)
  }

  const removeMember = (id: number) => {
    setMembers(membersRef.current.filter((m) => m.id !== id))
  }

  const updateMember = (id: number, key: keyof Member, value: unknown) => {
    setMembers(membersRef.current.map((m) => (m.id === id ? { ...m, [key]: value } as Member : m)))
  }

  const toggleNote = (id: number, note: string) => {
    setMembers(
      membersRef.current.map((m) =>
        m.id === id
          ? { ...m, notes: m.notes.includes(note) ? m.notes.filter((n) => n !== note) : [...m.notes, note] }
          : m,
      ),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = membersRef.current
    const t = travelRef.current
    if (!t.destination.trim()) {
      alert('목적지를 입력해주세요.')
      return
    }
    if (m.length === 0) {
      alert('여행자를 추가해주세요.')
      return
    }
    if (m.some((p) => !p.name.trim())) {
      alert('모든 여행자의 이름을 입력해주세요.')
      return
    }
    onGenerate(m, t)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Travelers Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h2 className="text-lg font-semibold text-gray-800">여행자 추가</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">이름과 나이를 입력하고 필요시 특이사항을 체크해주세요.</p>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">여행자 #{m.id}</span>
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(m.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMember(m.id, 'name', e.target.value)}
                    placeholder="이름 (예: 김민수)"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number" min={0} max={120}
                    value={m.age}
                    onChange={(e) => updateMember(m.id, 'age', Number(e.target.value))}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" placeholder="나이"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {[
                    { key: 'wheelchair', label: '휠체어/유모차 이용' },
                    { key: 'chronic', label: '만성질환 있음' },
                    { key: 'pregnant', label: '임산부' },
                    { key: 'infant', label: '영유아 동반' },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-1 cursor-pointer py-0.5">
                      <input type="checkbox" checked={m.notes.includes(opt.key)} onChange={() => toggleNote(m.id, opt.key)} className="accent-emerald-500" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addMember} className="mt-3 w-full rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 py-2.5 text-sm font-medium text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            동반자 추가
          </button>

          <div className="mt-3 flex gap-2">
            {[
              { label: '👤 혼자 여행', members: [{ id: 1, name: '김민수', age: 28, notes: [] }] },
              { label: '👫 연인 여행', members: [{ id: 1, name: '김민수', age: 30, notes: [] }, { id: 2, name: '이영희', age: 28, notes: [] }] },
              { label: '👨‍👩‍👧‍👦 가족 여행', members: [{ id: 1, name: '아빠', age: 40, notes: [] }, { id: 2, name: '엄마', age: 38, notes: [] }, { id: 3, name: '큰아이', age: 10, notes: [] }, { id: 4, name: '작은아이', age: 6, notes: ['infant'] }] },
              { label: '👴 3대 여행', members: [{ id: 1, name: '할아버지', age: 72, notes: ['chronic'] }, { id: 2, name: '아빠', age: 45, notes: [] }, { id: 3, name: '손자', age: 6, notes: ['infant'] }] },
            ].map((preset) => (
              <button key={preset.label} type="button" onClick={() => setMembers(preset.members as Member[])} className="flex-1 rounded-md bg-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors whitespace-nowrap">
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trip Info Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <h2 className="text-lg font-semibold text-gray-800">여행 정보 입력</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">목적지</label>
              <input type="text" value={travel.destination} onChange={(e) => setTravel({ ...travel, destination: e.target.value })} placeholder="예) 제주도, 부산, 강릉, 일본, 베트남" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">여행 기간</label>
                <select value={travel.duration} onChange={(e) => setTravel({ ...travel, duration: e.target.value })} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                  {DURATIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">여행 시기</label>
                <select value={travel.month} onChange={(e) => setTravel({ ...travel, month: e.target.value })} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                  {MONTHS.map((m) => (<option key={m} value={m.replace('월', '')}>{m}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">이동 수단</label>
              <div className="flex gap-4">
                {[
                  { value: 'car', label: '자차/렌트카' },
                  { value: 'public', label: '대중교통(기차/버스/도보)' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="radio" name="transport" value={opt.value} checked={travel.transport === opt.value} onChange={(e) => setTravel({ ...travel, transport: e.target.value })} className="accent-emerald-500" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !travel.destination.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-white font-semibold text-base shadow-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            여행 준비물을 분석 중이에요...
          </>
        ) : (
          <>{editLabel || '🤖 출발 준비를 함께 해볼까요?'}</>
        )}
      </button>
    </form>
  )
}
