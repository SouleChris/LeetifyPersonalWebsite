const express = require("express")
const cors = require("cors")
const axios = require("axios")

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// ================   Yahoo Stock endpoint.  ============================
app.get("/stock/:symbol", async (req, res) => {
  const { symbol } = req.params
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    )
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock data" })
  }
})
// ====================== End of Yahoo Stock Endpoint ====================


// =====================   Leetify API endpoint ==========================

let cachedData = null
let lastFetched = null

app.get("/leetify", async (req, res) => {
  const STEAM_ID = "76561198190351278"
  const API_KEY = "1c716ccf-e0a0-4a66-9e27-28c7801d6863"

  // Return cached data if less than 5 minutes old
  if (cachedData && lastFetched && (Date.now() - lastFetched) < 5 * 60 * 1000) {
    return res.json(cachedData)
  }

  try {
    const response = await axios.get(
      `https://api-public.cs-prod.leetify.com/v3/profile`,
      {
        params: { steam64_id: STEAM_ID },
        headers: {
          "X-Api-Key": API_KEY,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )
    cachedData = response.data
    lastFetched = Date.now()
    res.json(cachedData)
  } catch (error) {
    console.error(error.response?.status, error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
})

// =====================   End of Leetify API endpoint =================================



// =====================   Start of Leetify Matches API endpoint =================================


let cachedMatches = null
let lastFetchedMatches = null

app.get("/leetify/matches", async (req, res) => {
  const STEAM_ID = "76561198190351278"
  const API_KEY = "1c716ccf-e0a0-4a66-9e27-28c7801d6863"

  if (cachedMatches && lastFetchedMatches && (Date.now() - lastFetchedMatches) < 5 * 60 * 1000) {
    return res.json(cachedMatches)
  }

  try {
    const response = await axios.get(
      `https://api-public.cs-prod.leetify.com/v3/profile/matches`,
      {
        params: { steam64_id: STEAM_ID },
        headers: {
          "X-Api-Key": API_KEY,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )
    cachedMatches = response.data
    lastFetchedMatches = Date.now()
    res.json(cachedMatches)
  } catch (error) {
    console.error(error.response?.status, error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
})

// =====================   End of Leetify Matches API endpoint =================================



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

