import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import tripRouter from './routes/trip.js'
import aiRouter from './routes/ai.js'
import checklistRouter from './routes/checklist.js'
import memoRouter from './routes/memo.js'
import externalRouter from './routes/external.js'
import { authenticate } from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/trip', authenticate, tripRouter)
app.use('/api/trip', authenticate, aiRouter)
app.use('/api/checklist', authenticate, checklistRouter)
app.use('/api/memo', authenticate, memoRouter)
app.use('/api', externalRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Root route - guide users to the frontend
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>TravelMate AI API</title></head>
<body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;text-align:center">
  <h1>TravelMate AI API</h1>
  <p style="color:#666">AI Travel Companion</p>
  <p>프론트엔드는 <a href="http://localhost:5173">http://localhost:5173</a> 에서 접속하세요.</p>
  <p>API 서버 포트: ${PORT} &nbsp;|&nbsp; 상태: <a href="/api/health">/api/health</a></p>
</body>
</html>`)
})

app.listen(PORT, () => {
  console.log(`🚀 FamilyTrip API 서버 실행 중 → http://localhost:${PORT}`)
})
