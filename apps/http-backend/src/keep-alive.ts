import express from 'express'

const app = express()

app.post('/api/keep-alive', (_req, res) => {
  console.log('✅ HTTP Keep-alive ping received at', new Date().toISOString())
  res.status(200).json({ status: 'alive', service: 'http-backend' })
})

app.listen(10000, () => {
  console.log('HTTP Keep-alive endpoint running on port 10000')
})
