const express = require('express')
const bodyParser = require('body-parser')
const { time } = require('console')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true,
}))

// set cors
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, name',
  })
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.get('/get', (req, res) => {
  res.json(req.query)
})

app.post('/post', (req, res) => {
  res.json(req.body)
})

app.post('/post_timeout', (req, res) => {
  let { timeout } = req.body
  if (timeout) {
    timeout = parseInt(timeout, 10)
  } else {
    timeout = 0
  }
  setTimeout(() => {
    res.json(req.body)
  }, timeout)
})

app.post('/post_status', (req, res) => {
  let { code } = req.body
  if (code) {
    code = parseInt(code, 10)
  } else {
    code = 200
  }
  res.statusCode = code
  res.json(req.body)
})

app.listen(8080)
