import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

// POST /api/trip - 여행 + 가족 저장 (F-01)
router.post('/', (req, res) => {
  const { destination, duration, travel_month, transport, members } = req.body

  console.log('=== POST /api/trip ===')
  console.log('request.body.members count:', members?.length)
  console.log('request.body.members:', JSON.stringify(members, null, 2))

  if (!destination || !destination.trim()) {
    return res.status(400).json({ error: '목적지를 입력해주세요.' })
  }
  if (!members || members.length === 0) {
    return res.status(400).json({ error: '가족 구성원을 추가해주세요.' })
  }

  const db = getDb()
  const tripId = uuidv4()
  const now = new Date().toISOString()

  const insertTrip = db.prepare(
    `INSERT INTO Trip (trip_id, destination, duration, travel_month, transport, current_temp, weather_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertMember = db.prepare(
    `INSERT INTO FamilyMember (trip_id, relation, age, wheelchair, illness, medication)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  let insertedCount = 0
  const txn = db.transaction(() => {
    insertTrip.run(tripId, destination.trim(), duration, travel_month, transport, req.body.current_temp ?? null, req.body.weather_status ?? '', now)

    for (const m of members) {
      const age = Number(m.age)
      if (age < 0 || age > 120) { console.log('  SKIP (age out of range):', m); continue }
      insertMember.run(
        tripId,
        m.name || m.relationship || m.relation || '여행자',
        age,
        m.notes?.includes('wheelchair') ? 1 : 0,
        m.notes?.includes('chronic') ? 1 : 0,
        m.medication || ''
      )
      insertedCount++
    }
  })

  txn()
  console.log('FamilyMember INSERT count:', insertedCount)

  res.status(201).json({
    tripId,
    destination: destination.trim(),
    duration,
    travel_month,
    transport,
    createdAt: now,
  })
})

// GET /api/trip/history - 여행 이력 조회 (F-08)
router.get('/history', (req, res) => {
  const db = getDb()
  const trips = db.prepare(`
    SELECT t.*,
           (SELECT COUNT(*) FROM FamilyMember WHERE trip_id = t.trip_id) AS member_count,
           (SELECT COUNT(*) FROM AI_Result WHERE trip_id = t.trip_id) AS has_result
    FROM Trip t
    ORDER BY t.created_at DESC
  `).all()

  const full = trips.map((t) => ({
    tripId: t.trip_id,
    destination: t.destination,
    duration: t.duration,
    travel_month: t.travel_month,
    transport: t.transport,
    createdAt: t.created_at,
    memberCount: t.member_count,
    hasResult: t.has_result > 0,
  }))

  res.json(full)
})

// GET /api/trip/:id - 여행 전체 조회 (F-06)
router.get('/:id', (req, res) => {
  const db = getDb()
  const trip = db.prepare(`SELECT * FROM Trip WHERE trip_id = ?`).get(req.params.id)
  if (!trip) return res.status(404).json({ error: '여행 정보를 찾을 수 없습니다.' })

  const members = db.prepare(`SELECT * FROM FamilyMember WHERE trip_id = ?`).all(req.params.id)
  const result = db.prepare(`SELECT * FROM AI_Result WHERE trip_id = ? ORDER BY created_at DESC LIMIT 1`).get(req.params.id)
  const checklists = db.prepare(`SELECT * FROM ChecklistItem WHERE trip_id = ?`).all(req.params.id)

  res.json({
    tripId: trip.trip_id,
    destination: trip.destination,
    duration: trip.duration,
    travel_month: trip.travel_month,
    transport: trip.transport,
    current_temp: trip.current_temp,
    weather_status: trip.weather_status,
    createdAt: trip.created_at,
    members: members.map((m) => ({
      memberId: m.member_id,
      relation: m.relation,
      age: m.age,
      wheelchair: Boolean(m.wheelchair),
      illness: Boolean(m.illness),
      medication: m.medication,
    })),
    result: result
      ? {
          resultId: result.result_id,
          safetyNotice: result.safety_notice,
          emergencyTip: result.emergency_tip,
          createdAt: result.created_at,
        }
      : null,
    checklists: checklists.map((c) => ({
      itemId: c.item_id,
      memberId: c.member_id,
      itemName: c.item_name,
      category: c.category,
      isChecked: Boolean(c.is_checked),
      isCustom: Boolean(c.is_custom),
    })),
  })
})

// PUT /api/trip/:id/family - 가족 구성원 수정 (F-02)
router.put('/:id/family', (req, res) => {
  const { members } = req.body
  if (!members || members.length === 0) {
    return res.status(400).json({ error: '가족 구성원을 추가해주세요.' })
  }

  const db = getDb()
  const trip = db.prepare(`SELECT trip_id FROM Trip WHERE trip_id = ?`).get(req.params.id)
  if (!trip) return res.status(404).json({ error: '여행 정보를 찾을 수 없습니다.' })

  const deleteOld = db.prepare(`DELETE FROM FamilyMember WHERE trip_id = ?`)
  const insertMember = db.prepare(
    `INSERT INTO FamilyMember (trip_id, relation, age, wheelchair, illness, medication)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  const txn = db.transaction(() => {
    deleteOld.run(req.params.id)
    for (const m of members) {
      const age = Number(m.age)
      if (age < 0 || age > 120) continue
      insertMember.run(
        req.params.id,
        m.name || m.relationship || m.relation || '여행자',
        age,
        m.notes?.includes('wheelchair') ? 1 : 0,
        m.notes?.includes('chronic') ? 1 : 0,
        m.medication || ''
      )
    }
  })

  txn()
  res.json({ success: true })
})

export default router
