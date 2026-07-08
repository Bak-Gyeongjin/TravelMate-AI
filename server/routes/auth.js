import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getDb } from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'travelmate-dev-secret'

router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' })
  }
  if (username.length < 2) {
    return res.status(400).json({ error: '아이디는 2자 이상이어야 합니다.' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' })
  }

  const db = getDb()
  const existing = db.prepare('SELECT user_id FROM User WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const userId = uuidv4()
  const now = new Date().toISOString()

  db.prepare('INSERT INTO User (user_id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(userId, username, passwordHash, now)

  const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { userId, username } })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM User WHERE username = ?').get(username)
  if (!user) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' })
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' })
  }

  const token = jwt.sign({ userId: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { userId: user.user_id, username: user.username } })
})

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: '인증이 만료되었습니다. 다시 로그인해주세요.' })
  }
}

export default router
