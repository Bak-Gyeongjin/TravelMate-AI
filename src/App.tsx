import { useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import FamilyForm, { type Member, type TravelInfo } from './components/FamilyForm'
import ResultView from './components/ResultView'
import TravelBriefing from './components/TravelBriefing'
import type { BriefingData } from './components/TravelBriefing'
import FarewellCard from './components/FarewellCard'
import ChecklistSection from './components/ChecklistSection'
import MedicineMemo from './components/MedicineMemo'
import ProgressFooter from './components/ProgressFooter'
import TripHistory from './components/TripHistory'
import ChecklistOnlyModal from './components/ChecklistOnlyModal'
import { createTrip, generateChecklist, updateFamily, saveMemo, getTripHistory, getTrip, getGeo, getWeather, getNearby, deleteTrip } from './api'
import type { GenerateResponse, TripResult } from './api'

export interface MedicineNote {
  memberId: number
  memberLabel: string
  note: string
}

type Step = 'form' | 'result' | 'history'

interface MemberMeta {
  memberId: number
  label: string
  age: number
  conditions: string[]
}

function buildChecklistMap(data: GenerateResponse, memberMetas: MemberMeta[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  const memberById: Record<number, string> = {}
  memberMetas.forEach((m) => { memberById[m.memberId] = m.label })

  data.checklists.forEach((item) => {
    const key = item.memberId == null ? '공통' : (memberById[item.memberId] || `여행자 #${item.memberId}`)
    if (!map[key]) map[key] = []
    map[key].push(item.itemName)
  })

  return map
}

async function fetchBriefing(destination: string, month: number): Promise<BriefingData> {
  try {
    const geo = await getGeo(destination)
    const hasGeo = geo?.lat != null && geo?.lon != null
    const [weatherRes, hospitalsRes, pharmaciesRes] = await Promise.all([
      (hasGeo ? getWeather(geo!.lat as number, geo!.lon as number) : Promise.resolve(null)).catch(() => null),
      getNearby('hospital', destination, geo?.lat ?? undefined, geo?.lon ?? undefined).catch(() => ({ results: [] as Array<{ name: string; address: string; phone: string; note: string }> })),
      getNearby('pharmacy', destination, geo?.lat ?? undefined, geo?.lon ?? undefined).catch(() => ({ results: [] as Array<{ name: string; address: string; phone: string; note: string }> })),
    ])

    const isSummer = month >= 6 && month <= 8
    const isWinter = month >= 12 || month <= 2
    let riskLevel: BriefingData['riskLevel'] = '낮음'
    if (isSummer || isWinter) riskLevel = '보통'
    if (month === 7 || month === 8 || month === 1) riskLevel = '높음'

    return {
      weather: weatherRes ? { temp: weatherRes.temp, description: weatherRes.description, icon: weatherRes.icon } : null,
      hospitals: hospitalsRes.results || [],
      pharmacies: pharmaciesRes.results || [],
      riskLevel,
    }
  } catch {
    return { weather: null, hospitals: [], pharmacies: [], riskLevel: '낮음' }
  }
}

function generateSafetyBriefing(metas: MemberMeta[], travel: TravelInfo, temp: number | null, description: string | null): string {
  const lines: string[] = []
  const month = Number(travel.month)
  const allConditions = new Set(metas.flatMap((m) => m.conditions))

  lines.push(`안녕하세요, TravelMate예요 😊`)
  lines.push(`${month}월 ${travel.destination} 여행을 준비 중이시군요.`)

  // 날씨 조언
  if (temp != null && description) {
    if (temp >= 30) {
      lines.push(`오늘 ${travel.destination}은 ${temp}°C까지 올라가요. 폭염 가능성이 높으니 오전 시간대에 야외 일정을 배치하고, 오후에는 실내에서 휴식을 취하는 걸 추천해요. 수분을 충분히 준비해주세요.`)
    } else if (temp <= 5) {
      lines.push(`오늘 ${travel.destination}은 ${temp}°C로 쌀쌀해요. 따뜻한 옷차림으로 준비하시고, 실내 관광 코스를 고려해보세요.`)
    } else if (description.includes('비') || description.includes('rain')) {
      lines.push(`오늘 비 소식이 있어요. 우산을 챙기고 박물관이나 카페 같은 실내 코스로 변경해보는 건 어떨까요?`)
    } else if (description.includes('눈') || description.includes('snow')) {
      lines.push(`오늘 눈이 온대요. 미끄럼 조심하시고, 방한용품을 꼭 챙기세요.`)
    } else {
      lines.push(`오늘 ${travel.destination}은 활동하기 좋은 날씨예요. 가벼운 옷차림으로 즐거운 여행을 만끽하세요!`)
    }
  }

  // 계절 조언
  if (month >= 7 && month <= 8) {
    lines.push(`한여름 여행이니 충분한 휴식과 수분 섭취를 잊지 마세요.`)
  } else if (month >= 12 || month <= 2) {
    lines.push(`겨울 여행이니 방한에 신경 써주세요.`)
  }

  // 여행자 조건 조언
  if (allConditions.has('chronic')) {
    lines.push(`만성질환이 있는 여행자가 함께하고 있어요. 평소 복용하는 약을 충분히 준비하고, 무리하지 않는 일정으로 계획해보세요.`)
  }
  if (allConditions.has('wheelchair')) {
    lines.push(`휠체어나 유모차 이용자가 있어요. 이동 경로를 미리 확인하고, 필요하면 장애인 콜택시를 이용해보세요.`)
  }
  if (allConditions.has('pregnant')) {
    lines.push(`임산부와 함께하는 여행이에요. 무리하지 않도록 자주 쉬어가면서 여행해주세요.`)
  }
  if (allConditions.has('infant')) {
    lines.push(`영유아가 함께해요. 여벌 옷과 기저귀, 응급약과 체온계를 준비하면 좋아요.`)
  }
  if (metas.some((m) => m.age >= 65)) {
    lines.push(`고령자가 함께하고 있어 충분한 휴식을 권장해요. 무리한 일정은 피해주세요.`)
  }

  // 대표 의료기관 안내
  lines.push(`아래는 ${travel.destination} 지역의 대표 응급의료기관이에요. 여행 전에 한 번 확인해두시면 안심할 수 있어요.`)

  // 일반 조언
  lines.push(`출발 전에 충전기와 여권을 한 번 더 확인해보세요!`)

  return lines.join('\n\n')
}

function App() {
  const { user, logout } = useAuth()
  if (!user) return <LoginPage />

  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tripId, setTripId] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [briefing, setBriefing] = useState<BriefingData | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [safetyBriefing, setSafetyBriefing] = useState<string>('')
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set())
  const [medicineNotes, setMedicineNotes] = useState<MedicineNote[]>([])
  const [historyTrips, setHistoryTrips] = useState<Awaited<ReturnType<typeof getTripHistory>>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editingFamily, setEditingFamily] = useState(false)
  const [showChecklistOnly, setShowChecklistOnly] = useState(false)

  const [memberMetas, setMemberMetas] = useState<MemberMeta[]>([])
  const [lastMembers, setLastMembers] = useState<Member[]>([])
  const [lastTravel, setLastTravel] = useState<TravelInfo | null>(null)

  const CHECK_KEY = 'tm_checks'

  const handleGenerate = async (members: Member[], travel: TravelInfo) => {
    setLoading(true)
    setError(null)
    setMedicineNotes([])
    setCheckedSet(new Set())
    setEditingFamily(false)

    try {
      let tid = tripId
      if (editingFamily && tid) {
        await updateFamily(tid, members)
      } else {
        const weatherInfo = await getGeo(travel.destination).then(async (geo) => {
          if (geo?.lat == null || geo?.lon == null) return undefined
          const w = await getWeather(geo.lat, geo.lon).catch(() => null)
          return w ? { temp: w.temp, status: w.description } : undefined
        }).catch(() => undefined)

        const trip = await createTrip(members, travel, weatherInfo)
        tid = trip.tripId
        setTripId(tid)
      }
      if (!tid) throw new Error('tripId is null')

      const data = await generateChecklist(tid)
      setResult(data)

      const metas = data.members.map((m) => {
        const mem = members.find((x) => x.id === m.memberId)
        return {
          memberId: m.memberId,
          label: `${m.relation} (${m.age}세)`,
          age: m.age,
          conditions: mem?.notes || [],
        }
      })
      setMemberMetas(metas)
      setLastMembers(members)
      setLastTravel(travel)

      setBriefingLoading(true)
      fetchBriefing(travel.destination, Number(travel.month)).then((b) => {
        setBriefing(b)
        setSafetyBriefing(generateSafetyBriefing(metas, travel, b.weather?.temp ?? null, b.weather?.description ?? null))
      }).finally(() => setBriefingLoading(false))

      setStep('result')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('네트워크') || msg.includes('연결') || msg.includes('fetch')) {
        setError('서버 연결에 실패했어요.')
      } else {
        setError(msg || 'AI 응답을 가져오지 못했어요. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = useCallback((key: string) => {
    setCheckedSet((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleSaveChecklist = useCallback(() => {
    try {
      const obj: Record<string, boolean> = {}
      checkedSet.forEach((key) => { obj[key] = true })
      localStorage.setItem(CHECK_KEY, JSON.stringify(obj))
      alert('체크 상태가 저장되었습니다.')
    } catch {
      alert('저장에 실패했어요.')
    }
  }, [checkedSet])

  const handleAddMedicineNote = useCallback(async (memberId: number, memberLabel: string, note: string) => {
    if (tripId) await saveMemo(tripId, memberId, note).catch(() => {})
    setMedicineNotes((prev) => [...prev, { memberId, memberLabel, note }])
  }, [tripId])

  const injectMedicineNotes = (checklists: Record<string, string[]>): Record<string, string[]> => {
    const merged = { ...checklists }
    const memberById: Record<number, string> = {}
    memberMetas.forEach((m) => { memberById[m.memberId] = m.label })

    medicineNotes.forEach((mn) => {
      const label = memberById[mn.memberId]
      if (label && merged[label]) {
        merged[label] = [`💊 복용 알림: ${mn.note}`, ...merged[label]]
      } else {
        const firstKey = Object.keys(merged).find((k) => k !== '공통')
        if (firstKey) merged[firstKey] = [`💊 복용 알림: ${mn.note}`, ...merged[firstKey]]
      }
    })
    return merged
  }

  const checklistMap = result ? buildChecklistMap(result, memberMetas) : null
  const enrichedMap = checklistMap ? injectMedicineNotes(checklistMap) : null

  const totalItems = enrichedMap ? Object.values(enrichedMap).reduce((a, b) => a + b.length, 0) : 0
  const checkedCount = checkedSet.size
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  const buildMetaMap = () => {
    const map: Record<string, { age: number; conditions: string[] }> = {}
    memberMetas.forEach((m) => {
      map[m.label] = { age: m.age, conditions: m.conditions }
    })
    return map
  }

  const handleReset = () => {
    setStep('form')
    setResult(null)
    setTripId(null)
    setBriefing(null)
    setSafetyBriefing('')
    setCheckedSet(new Set())
    setMedicineNotes([])
    setError(null)
    setEditingFamily(false)
    setMemberMetas([])
    setLastMembers([])
    setLastTravel(null)
  }

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const trips = await getTripHistory()
      setHistoryTrips(trips)
    } catch {
      setHistoryTrips([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const openHistory = useCallback(async () => {
    setStep('history')
    await refreshHistory()
  }, [refreshHistory])

  const handleDeleteTrip = useCallback(async (tripId: string) => {
    if (!confirm('이 여행 기록을 삭제하시겠습니까?')) return
    try {
      await deleteTrip(tripId)
      await refreshHistory()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    }
  }, [refreshHistory])

  const loadTrip = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const trip: TripResult = await getTrip(id)
      if (!trip.result) {
        setError('해당 여행의 AI 결과가 없습니다. 다시 생성해주세요.')
        return
      }

      const genRes: GenerateResponse = {
        resultId: trip.result.resultId,
        safetyNotice: trip.result.safetyNotice,
        emergencyTip: trip.result.emergencyTip,
        members: trip.members.map((m) => ({
          memberId: m.memberId,
          relation: m.relation,
          age: m.age,
        })),
        checklists: trip.checklists.map((c) => ({
          itemId: c.itemId,
          memberId: c.memberId,
          itemName: c.itemName,
          category: c.category,
          isChecked: c.isChecked,
          isCustom: c.isCustom,
        })),
      }

      const metas: MemberMeta[] = trip.members.map((m) => ({
        memberId: m.memberId,
        label: `${m.relation} (${m.age}세)`,
        age: m.age,
        conditions: [
          ...(m.wheelchair ? ['wheelchair'] as const : []),
          ...(m.illness ? ['chronic'] as const : []),
        ],
      }))

      setTripId(id)
      setResult(genRes)
      setMemberMetas(metas)
      setLastMembers(trip.members.map((m) => ({
        id: m.memberId,
        name: m.relation,
        age: m.age,
        notes: [
          ...(m.wheelchair ? ['wheelchair'] as const : []),
          ...(m.illness ? ['chronic'] as const : []),
        ],
      })))
      setLastTravel({
        destination: trip.destination,
        duration: trip.duration,
        month: String(trip.travel_month),
        transport: trip.transport,
      })
      setMedicineNotes([])

      const storedChecks = localStorage.getItem(CHECK_KEY)
      if (storedChecks) {
        try {
          const parsed = JSON.parse(storedChecks) as Record<string, boolean>
          const checkedKeys = new Set(Object.keys(parsed))
          setCheckedSet(checkedKeys)
        } catch { /* ignore */ }
      } else {
        setCheckedSet(new Set())
      }

      setBriefingLoading(true)
      fetchBriefing(trip.destination, trip.travel_month).then((b) => {
        if (trip.current_temp != null && !b.weather) {
          b = { ...b, weather: { temp: trip.current_temp!, description: trip.weather_status || '', icon: '01d' } }
        }
        setBriefing(b)
        setSafetyBriefing(generateSafetyBriefing(metas, lastTravel || { destination: trip.destination, duration: trip.duration, month: String(trip.travel_month), transport: trip.transport }, b.weather?.temp ?? null, b.weather?.description ?? null))
      }).finally(() => setBriefingLoading(false))

      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onHistoryClick={openHistory} showBadges={step === 'form'} username={user.username} onLogout={logout} />
      <div className="mx-auto px-6 pb-12">
        {step === 'form' && (
          <div className="max-w-3xl mx-auto">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            <FamilyForm onGenerate={handleGenerate} loading={loading} />
          </div>
        )}

        {step === 'result' && (
          <div className="max-w-6xl mx-auto">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            {editingFamily ? (
              <FamilyForm onGenerate={handleGenerate} loading={loading} editLabel="🔄 여행자 정보 수정 후 재생성" initialMembers={lastMembers} initialTravel={lastTravel ?? undefined} />
            ) : enrichedMap && result ? (
              <>
                {/* Top Actions */}
                <div className="mb-6 flex items-center justify-end gap-2 flex-wrap">
                  <button type="button" onClick={() => setShowChecklistOnly(true)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 underline whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    체크리스트만
                  </button>
                  <button type="button" onClick={() => setEditingFamily(!editingFamily)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 underline whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {editingFamily ? '편집 취소' : '여행자 수정'}
                  </button>
                  <button type="button" onClick={handleReset} className="text-xs text-emerald-600 hover:text-emerald-700 underline">← 처음으로</button>
                </div>

                {/* 1. AI 안전 브리핑 + 대표 응급의료기관 */}
                <TravelBriefing briefing={briefing} destination={lastTravel?.destination} loading={briefingLoading} safetyBriefing={safetyBriefing} />

                {/* 2. 여행자 프로필 */}
                <ResultView
                  checklists={enrichedMap}
                  metaMap={buildMetaMap()}
                />

                {/* 3. 공통 준비물 + 여행자별 체크리스트 */}
                <ChecklistSection
                  data={enrichedMap}
                  checkedItems={checkedSet}
                  onToggle={handleToggle}
                  onSave={handleSaveChecklist}
                />

                {/* 4. 진행률 */}
                <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800">준비 진행률</span>
                        <p className="text-xs text-gray-400">{checkedCount}/{totalItems}개 완료</p>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-emerald-600 tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        progress === 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {progress === 100 && (
                    <p className="mt-3 text-sm text-emerald-600 font-medium text-center">✨ 모든 준비를 완료했어요! 즐거운 여행 되세요!</p>
                  )}
                  {progress > 0 && progress < 100 && (
                    <p className="mt-3 text-sm text-gray-400 text-center">체크리스트를 하나씩 완료할 때마다 진행률이 올라가요</p>
                  )}
                </div>

                {/* 5. 약 메모 */}
                <MedicineMemo
                  memberMetas={memberMetas}
                  onSave={handleAddMedicineNote}
                />

                {/* 6. Farewell */}
                <FarewellCard destination={lastTravel?.destination} />

                {/* FAB */}
                <ProgressFooter />

                {/* Checklist-Only Modal */}
                {showChecklistOnly && (
                  <ChecklistOnlyModal
                    data={enrichedMap}
                    checkedItems={checkedSet}
                    onToggle={handleToggle}
                    onSave={handleSaveChecklist}
                    totalItems={totalItems}
                    checkedCount={checkedCount}
                    onClose={() => setShowChecklistOnly(false)}
                  />
                )}
              </>
            ) : null}
          </div>
        )}

        {step === 'history' && (
          <div className="max-w-3xl mx-auto">
            <TripHistory trips={historyTrips} onSelect={loadTrip} onBack={() => setStep('form')} loading={historyLoading} onDelete={handleDeleteTrip} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
