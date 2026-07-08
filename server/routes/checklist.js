import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

// PUT /api/checklist/:id - 체크 상태 수정 (F-04)
router.put('/:id', (req, res) => {
  const { checked } = req.body
  const db = getDb()

  const item = db.prepare(`SELECT * FROM ChecklistItem WHERE item_id = ?`).get(req.params.id)
  if (!item) return res.status(404).json({ error: '체크리스트 항목을 찾을 수 없습니다.' })

  db.prepare(`UPDATE ChecklistItem SET is_checked = ? WHERE item_id = ?`).run(checked ? 1 : 0, req.params.id)

  res.json({ success: true })
})

export default router
