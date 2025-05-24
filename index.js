import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

let db
async function initializeDatabase() {
  db = await open({
    filename: 'conversation.db',
    driver: sqlite3.Database,
  })

  // Crear la tabla de mensajes si no existe
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      client TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

initializeDatabase()

app.use(cors())
app.use(express.json())

app.use('/ping', (req, res) => { res.send('ok') } )

io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado:')

  const messages = await db.all(
    'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50',
  )
  socket.emit('previous-messages', messages)

  socket.on('new-text', async (content) => {
    if (content.client === 'PC' || content.client === 'MOBILE') {
      await db.run('INSERT INTO messages (content, client) VALUES (?, ?)', [
        content.text,
        content.client,
      ])

      io.emit('new-text', content)
      console.log(
        'Nuevo texto recibido desde un cliente:',
        content.client,
        content,
      )
    }
  })
})

app.post('/', async (req, res) => {
  const { text } = req.body

  await db.run('INSERT INTO messages (content, client) VALUES (?, ?)', [
    text,
    'API',
  ])

  io.emit('nuevo-texto', text)

  res.send({ status: 'ok' })
})

app.get('/messages', async (req, res) => {
  const messages = await db.all(
    'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50',
  )
  res.json(messages)
})

httpServer.listen(7373, () => {
  console.log('Servidor funcionando en puerto 7373')
})
