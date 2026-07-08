import { Router } from 'express'
import { getDb } from '../db.js'
import { appendFileSync } from 'fs'

function log(msg) {
  console.log(msg)
  try { appendFileSync('C:\\travel-manager\\server\\ai-debug.log', msg + '\n') } catch {}
}

const router = Router()

function buildPrompt(trip, members) {
  log(`[buildPrompt] members count: ${members.length}`)
  log(`[buildPrompt] members: ${JSON.stringify(members.map(m => ({ relation: m.relation, age: m.age, wheelchair: m.wheelchair, illness: m.illness })))}`)
  const memberLines = members
    .map((m) => {
      const notes = []
      if (m.wheelchair) notes.push('휠체어/유모차 이용')
      if (m.illness) notes.push('만성질환(혈압/당뇨 등) 있음')
      return `- ${m.relation}: ${m.age}세${notes.length ? ` (${notes.join(', ')})` : ''}`
    })
    .join('\n')

  return `당신은 여행 동반자(Travel Companion)입니다. 사용자의 여행을 함께 준비해주는 역할을 합니다.
아래 입력 정보를 바탕으로 JSON 형식으로 응답하세요. 말투는 따뜻하고 친근하게 해주세요.

## 입력 정보
### 여행자
${memberLines}

### 여행 정보
- 목적지: ${trip.destination}
- 기간: ${trip.duration}
- 시기: ${trip.travel_month}월
- 이동수단: ${trip.transport === 'car' ? '자차/렌트카' : '대중교통(기차/버스/도보)'}

## 응답 규칙 (반드시 지킬 것)
Rule 1 (개인화): 공통 준비물 외에, 각 여행자의 연령과 특성에 맞는 필수품을 반드시 포함할 것.
Rule 2 (맥락 반영): 여행 시기(월)와 목적지를 기반으로 한 날씨 주의사항 포함. (예: 8월 제주도 → 폭염 대비, 12월 강릉 → 한파 대비)
Rule 3 (배리어프리): 휠체어/유모차 이용 시, 이동 동선 및 숙소 선택 시 주의할 점을 안내할 것.
Rule 4 (응급 대처): 고령자나 영유아가 포함된 경우, 목적지 인근 응급실 정보나 119 연락망을 강조할 것.

## 안전 안내(safety_notice) 작성 규칙
- 날씨 주의사항과 배리어프리 정보를 자연스러운 한 문단으로 작성해주세요.
- "님" 존칭을 사용하고, 딱딱하지 않게 부드러운 말투로 작성해주세요.
- 예: "8월 제주도는 폭염 위험이 있어요. 오후 2시~5시 사이 야외 활동을 자제하고, 충분한 수분을 섭취하세요. 휠체어 이용 시 계단이 많은 관광지는 피하고 엘리베이터 유무를 미리 확인해두는 게 좋아요."

## 응급 안내(emergency_tip) 작성 규칙
- "님" 존칭을 사용하고 상황에 맞게 공감하는 말투로 작성해주세요.
- 예: "고령자와 영유아가 함께하는 여행이니, 목적지 인근 종합병원 위치를 꼭 확인해두세요. 응급상황 발생 시 119에 즉시 연락하십시오."

## 응답 JSON 형식
{
  "safety_notice": "안전 안내 문자열 (부드러운 말투)",
  "emergency_tip": "응급 대처 안내 문자열 (부드러운 말투)",
  "checklists": [
    { "item_name": "보조배터리", "category": "공통", "member_index": null },
    { "item_name": "혈압약", "category": "개인", "member_index": 0 },
    { "item_name": "유모차", "category": "개인", "member_index": 2 }
  ]
}

checklists 배열에서 category는 "공통" 또는 "개인"입니다.
member_index는 개인 준비물일 경우 members 배열의 0-based 인덱스, 공통이면 null입니다.
JSON 외 다른 텍스트는 출력하지 마세요.`
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API 오류: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답이 비어 있습니다.')

  log('=== Gemini RAW response.text ===')
  log(text)

  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('JSON 파싱 실패')

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1))
}

function generateMock(trip, members) {
  const monthNum = trip.travel_month
  let safety = ''
  let emergency = ''

  if (monthNum >= 6 && monthNum <= 8) {
    safety = `${monthNum}월 ${trip.destination}은 폭염 위험이 있어요. 오후 2시~5시 사이 야외 활동을 자제하고, 충분한 수분을 섭취하는 게 좋아요.`
  } else if (monthNum >= 12 || monthNum <= 2) {
    safety = `${monthNum}월 ${trip.destination}은 한파 및 빙판길 위험이 있어요. 고령자와 영유아는 보온에 각별히 유의해주세요.`
  } else if (monthNum >= 3 && monthNum <= 5) {
    safety = `${monthNum}월 ${trip.destination}은 꽃가루/황사 발생 가능성이 있어요. 알레르기 체질이라면 마스크를 준비하는 게 좋아요.`
  } else {
    safety = `${monthNum}월 ${trip.destination}은 일교차가 크니, 겉옷을 꼭 챙기세요.`
  }

  const hasWheelchair = members.some((m) => m.wheelchair)
  const hasElderly = members.some((m) => m.age >= 65)
  const hasInfant = members.some((m) => m.age <= 7)

  if (hasWheelchair) {
    safety += ' 휠체어/유모차 이용 시 계단이 많은 관광지는 피하고, 엘리베이터 유무를 사전에 확인해두는 게 좋아요.'
  }
  if (hasElderly) {
    safety += ' 고령자 여행자를 위해 무리한 일정은 피하고 충분한 휴식 시간을 확보해주세요.'
  }

  if (hasElderly || hasInfant) {
    emergency = `${trip.destination} 인근 종합병원 위치를 미리 확인해두는 게 좋아요. 응급상황 발생 시 119에 즉시 연락하세요.`
  } else {
    emergency = `${trip.destination} 지역 응급실 정보를 미리 확인해두세요.`
  }

  const checklists = []
  checklists.push({ item_name: '보조배터리', category: '공통', member_index: null })
  checklists.push({ item_name: '멀티탭', category: '공통', member_index: null })
  checklists.push({ item_name: '우산', category: '공통', member_index: null })
  checklists.push({ item_name: '선크림', category: '공통', member_index: null })
  checklists.push({ item_name: '여벌 마스크', category: '공통', member_index: null })
  checklists.push({ item_name: '물티슈', category: '공통', member_index: null })

  members.forEach((m, i) => {
    const items = []
    if (m.age >= 65) items.push('혈압약', '무릎보호대', '가벼운 담요', '따뜻한 내의')
    if (m.age <= 7) items.push('유모차/아기띠', '여벌옷 3벌', '기저귀', '물티슈', '이유식/간식')
    if (m.age > 7 && m.age <= 18) items.push('간식', '태블릿/장난감', '여벌옷', '캐리어')
    if (m.wheelchair) items.push('휠체어 수리 키트', '경사로 정보 확인')
    if (m.illness) items.push('처방약 여분', '혈당 측정기', '상비약')
    if (items.length === 0) items.push('개인 세면도구', '여벌 옷', '캐리어')

    items.forEach((name) => {
      checklists.push({ item_name: name, category: '개인', member_index: i })
    })
  })

  return { safety_notice: safety, emergency_tip: emergency, checklists }
}

// POST /api/trip/:id/generate - AI 체크리스트 생성 (F-03)
router.post('/:id/generate', async (req, res) => {
  const db = getDb()

  log('=== POST /api/trip/:id/generate ===')
  log(`trip_id: ${req.params.id}`)

  const trip = db.prepare(`SELECT * FROM Trip WHERE trip_id = ?`).get(req.params.id)
  if (!trip) return res.status(404).json({ error: '여행 정보를 찾을 수 없습니다.' })
  log(`Trip 조회 결과: ${JSON.stringify(trip, null, 2)}`)

  const members = db.prepare(`SELECT * FROM FamilyMember WHERE trip_id = ?`).all(req.params.id)
  log(`FamilyMember 조회 결과 count: ${members.length}`)
  log(`FamilyMember 조회 결과: ${JSON.stringify(members, null, 2)}`)
  if (members.length === 0) {
    return res.status(400).json({ error: '가족 구성원이 없습니다.' })
  }

  let parsed
  try {
    const prompt = buildPrompt(trip, members)
    log('=== Gemini Prompt ===')
    log(prompt)
    parsed = await callGemini(prompt)
    log('=== Gemini RAW Response ===')
    log(JSON.stringify(parsed, null, 2))
  } catch (geminiErr) {
    // Gemini 실패 시 mock fallback
    log(`Gemini API 호출 실패, mock 사용: ${geminiErr.message}`)
    parsed = generateMock(trip, members)
  }

  // AI_Result 저장
  const insertResult = db.prepare(
    `INSERT INTO AI_Result (trip_id, safety_notice, emergency_tip) VALUES (?, ?, ?)`
  )
  const resultId = insertResult.run(req.params.id, parsed.safety_notice, parsed.emergency_tip).lastInsertRowid

  // 기존 ChecklistItem 삭제 후 재생성
  db.prepare(`DELETE FROM ChecklistItem WHERE trip_id = ?`).run(req.params.id)

  const insertItem = db.prepare(
    `INSERT INTO ChecklistItem (trip_id, member_id, item_name, category) VALUES (?, ?, ?, ?)`
  )

  const txn = db.transaction(() => {
    for (const item of parsed.checklists) {
      const memberId = item.member_index != null ? members[item.member_index]?.member_id : null
      insertItem.run(req.params.id, memberId, item.item_name, item.category)
    }
  })
  txn()

  res.status(201).json({
    resultId,
    safetyNotice: parsed.safety_notice,
    emergencyTip: parsed.emergency_tip,
    members: members.map((m) => ({
      memberId: m.member_id,
      relation: m.relation,
      age: m.age,
    })),
    checklists: parsed.checklists.map((item, idx) => ({
      itemId: idx + 1,
      memberId: item.member_index != null ? members[item.member_index]?.member_id : null,
      itemName: item.item_name,
      category: item.category,
      isChecked: false,
      isCustom: false,
    })),
  })
})

export default router
