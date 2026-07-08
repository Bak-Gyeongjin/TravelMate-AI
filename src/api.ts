import type { Member, TravelInfo } from './components/FamilyForm'

export interface GenerateResponse {
  resultId?: number
  safetyNotice: string
  emergencyTip: string
  members: Array<{
    memberId: number
    relation: string
    age: number
  }>
  checklists: Array<{
    itemId: number
    memberId: number | null
    itemName: string
    category: string
    isChecked: boolean
    isCustom: boolean
  }>
}

export interface TripResult {
  tripId: string
  destination: string
  duration: string
  travel_month: number
  transport: string
  current_temp: number | null
  weather_status: string
  createdAt: string
  members: Array<{
    memberId: number
    relation: string
    age: number
    wheelchair: boolean
    illness: boolean
    medication: string
  }>
  result: {
    resultId: number
    safetyNotice: string
    emergencyTip: string
    createdAt: string
  } | null
  checklists: Array<{
    itemId: number
    memberId: number | null
    itemName: string
    category: string
    isChecked: boolean
    isCustom: boolean
  }>
}

export interface TripHistoryItem {
  tripId: string
  destination: string
  duration: string
  travel_month: number
  transport: string
  createdAt: string
  memberCount: number
  hasResult: boolean
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function toApiMember(m: Member) {
  return {
    name: m.name,
    age: m.age,
    notes: m.notes,
  }
}

// F-01: POST /api/trip
export async function createTrip(members: Member[], travel: TravelInfo, weather?: { temp: number; status: string }): Promise<{ tripId: string }> {
  console.log('[createTrip] members count:', members.length, members)
  return apiFetch('/api/trip', {
    method: 'POST',
    body: JSON.stringify({
      destination: travel.destination,
      duration: travel.duration,
      travel_month: Number(travel.month),
      transport: travel.transport,
      current_temp: weather?.temp ?? null,
      weather_status: weather?.status ?? '',
      members: members.map(toApiMember),
    }),
  })
}

// F-02: PUT /api/trip/:id/family
export async function updateFamily(tripId: string, members: Member[]): Promise<void> {
  await apiFetch(`/api/trip/${tripId}/family`, {
    method: 'PUT',
    body: JSON.stringify({ members: members.map(toApiMember) }),
  })
}

// F-03: POST /api/trip/:id/generate
export async function generateChecklist(tripId: string): Promise<GenerateResponse> {
  return apiFetch(`/api/trip/${tripId}/generate`, { method: 'POST' })
}

// F-04: PUT /api/checklist/:id
export async function updateCheckItem(itemId: number, checked: boolean): Promise<void> {
  await apiFetch(`/api/checklist/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ checked }),
  })
}

// F-05: POST /api/memo
export async function saveMemo(tripId: string, memberId: number, note: string): Promise<void> {
  await apiFetch('/api/memo', {
    method: 'POST',
    body: JSON.stringify({ tripId, memberId, note }),
  })
}

// F-06: GET /api/trip/:id
export async function getTrip(tripId: string): Promise<TripResult> {
  return apiFetch(`/api/trip/${tripId}`)
}

// F-08: GET /api/trip/history
export async function getTripHistory(): Promise<TripHistoryItem[]> {
  return apiFetch('/api/trip/history')
}

// External: GET /api/geo?q= — 도시 → 좌표 (미등록 시 null)
export async function getGeo(city: string): Promise<{ lat: number | null; lon: number | null }> {
  return apiFetch(`/api/geo?q=${encodeURIComponent(city)}`)
}

// External: GET /api/weather?lat=&lon= — 실시간 날씨
export async function getWeather(lat: number, lon: number): Promise<{
  temp: number; feels_like: number; humidity: number; description: string; icon: string
}> {
  return apiFetch(`/api/weather?lat=${lat}&lon=${lon}`)
}

// External: GET /api/nearby?type=&dest=&lat=&lon=
export async function getNearby(type: 'hospital' | 'pharmacy', dest?: string, lat?: number, lon?: number): Promise<{
  results: Array<{ name: string; address: string; phone: string; note: string }>
}> {
  const params = new URLSearchParams({ type })
  if (dest) params.set('dest', dest)
  if (lat != null) params.set('lat', String(lat))
  if (lon != null) params.set('lon', String(lon))
  return apiFetch(`/api/nearby?${params.toString()}`)
}
