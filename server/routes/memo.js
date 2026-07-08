import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

// POST /api/memo - 복용 메모 저장 (F-05)
router.post('/', (req, res) => {
  const { tripId, memberId, note } = req.body
  if (!tripId || !memberId || !note || !note.trim()) {
    return res.status(400).json({ error: 'tripId, memberId, note가 필요합니다.' })
  }

  const db = getDb()
  const member = db.prepare(`SELECT * FROM FamilyMember WHERE member_id = ? AND trip_id = ?`).get(memberId, tripId)
  if (!member) return res.status(404).json({ error: '구성원을 찾을 수 없습니다.' })

  const existing = member.medication ? member.medication + '\n' : ''
  db.prepare(`UPDATE FamilyMember SET medication = ? WHERE member_id = ?`).run(existing + note.trim(), memberId)

  res.status(201).json({ success: true })
})

export default router
