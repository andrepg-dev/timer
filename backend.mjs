// backend.js
import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import cors from 'cors'
import { DateTime } from 'luxon'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.static('public'));

app.get('/api/hopta-time', async (req, res) => {
  const API_KEY = process.env.TOGGL_API_KEY
  const WORKSPACE_ID = process.env.TOGGL_WORKSPACE_ID
  const PROJECT_NAME = 'hopta'

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

const zone = 'America/Tegucigalpa';

const today = DateTime.now().startOf('day').toISODate() // YYYY-MM-DD
const tomorrow = DateTime.now().setZone(zone).plus({ days: 5 }).startOf('day').toISODate()


  const url = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${today}&end_date=${tomorrow}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${API_KEY}:api_token`).toString('base64')
      }
    })

    if (!response.ok) {
      return res.status(500).json({ error: 'Toggl API error? no se que coño pasa' })
    }

    const data = await response.json()
    const dataFiltered = data.filter(value => value.description.toLowerCase() == "hopta" )
        

    res.json(dataFiltered)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`)
})

