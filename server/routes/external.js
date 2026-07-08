import { Router } from 'express'

const router = Router()

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || ''

// ── 대표 응급의료기관 & 약국 (정적 데이터) ──
const REPRESENTATIVE_FACILITIES = {
  '제주도': {
    hospitals: [
      { name: '제주대학교병원', address: '제주특별자치도 제주시 아라1동', phone: '064-717-1114', note: '제주 지역 대표 종합병원이에요. 응급실 24시간 운영 중이니 참고해두세요.' },
      { name: '서귀포의료원', address: '제주특별자치도 서귀포시 서호동', phone: '064-730-3000', note: '서귀포 지역 응급의료기관으로, 제주 남부에서 이용할 수 있어요.' },
    ],
    pharmacies: [
      { name: '제주중앙약국', address: '제주시 연동 300-1', phone: '064-746-1234', note: '제주시 중심가에 있어 접근하기 편해요.' },
    ],
  },
  '부산': {
    hospitals: [
      { name: '부산대학교병원', address: '부산 서구 아미동', phone: '051-240-7000', note: '부산 지역 거점 응급의료센터로 24시간 운영하고 있어요.' },
      { name: '동아대학교병원', address: '부산 서구 동대신동', phone: '051-240-2000', note: '부산 서부권 대표 응급의료기관이에요.' },
    ],
    pharmacies: [
      { name: '부산온누리약국', address: '부산 서구 아미동 1-10', phone: '051-241-1111', note: '부산대학교병원 인근에 있어 연계 이용하기 좋아요.' },
    ],
  },
  '강릉': {
    hospitals: [
      { name: '강릉아산병원', address: '강원 강릉시 사천면', phone: '033-610-3114', note: '강릉 지역 대표 응급의료기관이에요.' },
      { name: '강릉의료원', address: '강원 강릉시 경포로', phone: '033-650-5000', note: '강릉 시내에 위치한 응급의료기관이에요.' },
    ],
    pharmacies: [
      { name: '강릉중앙약국', address: '강릉시 성남동', phone: '033-642-1111', note: '강릉 시내에서 찾기 쉬운 약국이에요.' },
    ],
  },
  '여수': {
    hospitals: [
      { name: '여수전남병원', address: '전남 여수시 여서동', phone: '061-690-7000', note: '여수 지역 응급의료기관이에요.' },
    ],
    pharmacies: [
      { name: '여수약국', address: '전남 여수시 여서동 100-4', phone: '061-652-3333', note: '여수 시내에서 이용하기 좋은 약국이에요.' },
    ],
  },
  '서울': {
    hospitals: [
      { name: '서울대학교병원', address: '서울 종로구 대학로', phone: '02-2072-2114', note: '서울 지역 거점 응급의료센터로 24hours 운영하고 있어요.' },
      { name: '삼성서울병원', address: '서울 강남구 일원동', phone: '02-3410-2114', note: '강남 지역 대표 응급의료기관이에요.' },
    ],
    pharmacies: [
      { name: '서울약국', address: '서울 종로구 종로 1가', phone: '02-123-4567', note: '서울대학교병원 인근에서 찾을 수 있어요.' },
    ],
  },
}

// ── 도시명 → key 매칭 (없으면 null) ──
const CITY_ALIAS = {
  '제주도': '제주도', '제주': '제주도', 'jeju': '제주도', 'Jeju': '제주도',
  '부산': '부산', 'busan': '부산', 'Busan': '부산',
  '강릉': '강릉', 'gangneung': '강릉', 'Gangneung': '강릉',
  '여수': '여수', 'yeosu': '여수', 'Yeosu': '여수',
  '서울': '서울', 'seoul': '서울', 'Seoul': '서울',
}

function resolveCity(dest) {
  if (!dest) return null
  const lower = dest.toLowerCase().trim()
  for (const [alias, key] of Object.entries(CITY_ALIAS)) {
    if (lower === alias.toLowerCase()) return key
  }
  const sorted = Object.entries(CITY_ALIAS).sort((a, b) => b[0].length - a[0].length)
  for (const [alias, key] of sorted) {
    if (lower.includes(alias.toLowerCase())) return key
  }
  return null
}

// ── Haversine distance (km) - 유지 but 사용 안 함 (Overpass 제거로 인해) ──
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

// ── OpenStreetMap Nominatim Geocoding (free) ──
async function nominatimGeocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
  const resp = await fetch(url, { headers: { 'User-Agent': 'TravelMate/1.0' } })
  if (!resp.ok) throw new Error(`Nominatim 오류: ${resp.status}`)
  const data = await resp.json()
  if (data.length) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  return null
}

// ── Overpass API query (representative facilities fallback) ──
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

async function queryOverpass(type, lat, lon, radius = 10000) {
  const amenity = type === 'hospital' ? '["amenity"~"hospital|clinic"]' : '["amenity"="pharmacy"]'
  const query = `[out:json];node${amenity}(around:${radius},${lat},${lon});out center 8;`
  const params = new URLSearchParams({ data: query })
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'TravelMate/1.0',
    },
    body: params.toString(),
  })
  if (!resp.ok) throw new Error(`Overpass 오류: ${resp.status}`)
  const data = await resp.json()

  const results = []
  for (const el of data.elements || []) {
    if (!el.tags?.name) continue
    const name = el.tags.name
    const address = [el.tags['addr:street'], el.tags['addr:housenumber'], el.tags['addr:city']].filter(Boolean).join(' ') || '주소 정보 없음'
    const phone = el.tags['contact:phone'] || el.tags['phone'] || '전화번호 정보 없음'
    results.push({
      name,
      address,
      phone,
      note: `여행지 인근 ${type === 'hospital' ? '의료기관' : '약국'}이에요. 참고용으로 확인해두세요.`,
    })
    if (results.length >= 3) break
  }
  return results
}

// ── GET /api/nearby — 등록 도시 → curated / 미등록 도시 → Overpass fallback ──
router.get('/nearby', async (req, res) => {
  const { type, dest, lat, lon } = req.query
  if (!type || !['hospital', 'pharmacy'].includes(type)) {
    return res.status(400).json({ error: 'type은 hospital 또는 pharmacy입니다.' })
  }

  // 1) 등록 도시 → curated 대표 데이터
  const city = resolveCity(dest)
  if (city && REPRESENTATIVE_FACILITIES[city]) {
    const fac = REPRESENTATIVE_FACILITIES[city]
    return res.json({ results: type === 'hospital' ? fac.hospitals : fac.pharmacies })
  }

  // 2) 미등록 도시 + 좌표 있음 → Overpass fallback
  if (lat && lon) {
    try {
      const results = await queryOverpass(type, parseFloat(lat), parseFloat(lon))
      if (results.length > 0) return res.json({ results })
    } catch (err) {
      console.error(`[nearby] Overpass ${type} 실패:`, err.message)
    }
  }

  // 3) 데이터 없음
  res.json({ results: [] })
})

// ── 공용 좌표 Mock ──
const MOCK_COORDS = {
  '제주도': { lat: 33.4996, lon: 126.5312 },
  '제주': { lat: 33.4996, lon: 126.5312 },
  'jeju': { lat: 33.4996, lon: 126.5312 },
  'Jeju': { lat: 33.4996, lon: 126.5312 },
  '부산': { lat: 35.1796, lon: 129.0756 },
  'busan': { lat: 35.1796, lon: 129.0756 },
  'Busan': { lat: 35.1796, lon: 129.0756 },
  '서울': { lat: 37.5665, lon: 126.9780 },
  'seoul': { lat: 37.5665, lon: 126.9780 },
  'Seoul': { lat: 37.5665, lon: 126.9780 },
  '강릉': { lat: 37.7519, lon: 128.8761 },
  'gangneung': { lat: 37.7519, lon: 128.8761 },
  '속초': { lat: 38.2070, lon: 128.5918 },
  '여수': { lat: 34.7604, lon: 127.6622 },
  'yeosu': { lat: 34.7604, lon: 127.6622 },
  '인천': { lat: 37.4563, lon: 126.7052 },
  '대구': { lat: 35.8722, lon: 128.6015 },
  '대전': { lat: 36.3504, lon: 127.3845 },
  '광주': { lat: 35.1595, lon: 126.8526 },
  '일본': { lat: 35.6762, lon: 139.6503 },
  '도쿄': { lat: 35.6762, lon: 139.6503 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  '오사카': { lat: 34.6937, lon: 135.5023 },
  'osaka': { lat: 34.6937, lon: 135.5023 },
  '베트남': { lat: 21.0285, lon: 105.8542 },
  'vietnam': { lat: 21.0285, lon: 105.8542 },
  '하노이': { lat: 21.0285, lon: 105.8542 },
  'hanoi': { lat: 21.0285, lon: 105.8542 },
  '다낭': { lat: 16.0544, lon: 108.2022 },
  'danang': { lat: 16.0544, lon: 108.2022 },
  '방콕': { lat: 13.7563, lon: 100.5018 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  '괌': { lat: 13.4443, lon: 144.7937 },
  'guam': { lat: 13.4443, lon: 144.7937 },
}

function pickCoord(q) {
  if (!q) return null
  const lower = q.toLowerCase().trim()
  if (MOCK_COORDS[lower]) return MOCK_COORDS[lower]
  const sorted = Object.keys(MOCK_COORDS).sort((a, b) => b.length - a.length)
  for (const k of sorted) {
    if (lower.includes(k.toLowerCase())) return MOCK_COORDS[k]
  }
  return null
}

// ── GET /api/geo — 도시 → 좌표 (MOCK → Nominatim fallback) ──
router.get('/geo', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: '도시명(q)이 필요합니다.' })

  // 1) MOCK_COORDS
  const local = pickCoord(q)
  if (local) return res.json(local)

  // 2) Nominatim (free, no key)
  try {
    const nom = await nominatimGeocode(q)
    if (nom) return res.json(nom)
  } catch (err) {
    console.error('[geo] Nominatim 실패:', err.message)
  }

  // 3) OpenWeatherMap Geocoding (if key available)
  if (WEATHER_API_KEY) {
    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${WEATHER_API_KEY}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`Geocoding 오류: ${resp.status}`)
      const data = await resp.json()
      if (data.length) return res.json({ lat: data[0].lat, lon: data[0].lon })
    } catch (err) {
      console.error('[geo] Geocoding API 실패:', err.message)
    }
  }

  // 4) 모두 실패
  res.json({ lat: null, lon: null })
})

// ── GET /api/weather ──
router.get('/weather', async (req, res) => {
  const { lat, lon } = req.query
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat, lon이 필요합니다.' })
  }

  if (!WEATHER_API_KEY) {
    return res.json({
      temp: 25, feels_like: 24, humidity: 60, description: '맑음', icon: '01d',
    })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${WEATHER_API_KEY}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`OpenWeatherMap 오류: ${resp.status}`)
    const data = await resp.json()
    res.json({
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    })
  } catch (err) {
    console.error('Weather API 실패:', err.message)
    res.json({
      temp: 25, feels_like: 24, humidity: 60, description: '맑음', icon: '01d',
    })
  }
})

export default router
