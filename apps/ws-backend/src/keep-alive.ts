//@ts-ignore
import express from "express"

const app = express()
//@ts-ignore
app.post('/api/keep-alive', (_req, res) => {
  console.log('✅ WebSocket Keep-alive ping received at', new Date().toISOString())
  res.status(200).json({ status: 'alive', service: 'ws-backend' })
})

app.listen(10000, () => {
  console.log('WebSocket Keep-alive endpoint running on port 10000')
})
