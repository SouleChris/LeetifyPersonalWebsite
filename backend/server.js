require("dotenv").config();
const express = require("express")
const cors = require("cors")
const axios = require("axios")
const app = express()
const PORT = 3000

const STEAM_ID = process.env.STEAM_ID
const API_KEY = process.env.LEETIFY_API_KEY
const { createClient } = require("@supabase/supabase-js")
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

console.log("Supabase URL:", process.env.SUPABASE_URL)
console.log("Supabase Key:", process.env.SUPABASE_KEY?.slice(0, 20))

app.use(cors())
app.use(express.json())

// ===================== Steam CS2 Inventory endpoint =====================
let cachedSteamInventory = null
let lastFetchedSteamInventory = null

app.get("/steam/inventory", async (req, res) => {
  if (cachedSteamInventory && lastFetchedSteamInventory && (Date.now() - lastFetchedSteamInventory) < 30 * 60 * 1000) {
    return res.json(cachedSteamInventory)
  }
  try {
    const STEAM_ID = process.env.STEAM_ID
    const response = await axios.get(
      `https://steamcommunity.com/inventory/${STEAM_ID}/730/2?l=english&count=5000`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    )
    cachedSteamInventory = response.data
    lastFetchedSteamInventory = Date.now()
    res.json(cachedSteamInventory)
  } catch (error) {
    console.error(error.response?.status, error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
  console.log("Steam inventory:", JSON.stringify(response.data).slice(0, 2000))
})
// ===================== End Steam CS2 Inventory endpoint =================


// ===================== CSFloat Inventory endpoint =====================

/* 
let cachedInventory = null
let lastFetchedInventory = null

app.get("/csfloat/inventory", async (req, res) => {
  if (cachedInventory && lastFetchedInventory && (Date.now() - lastFetchedInventory) < 30 * 60 * 1000) {
    return res.json(cachedInventory)
  }
  try {
    const response = await axios.get("https://csfloat.com/api/v1/me/inventory", {
      headers: { Authorization: process.env.CSFLOAT_API_KEY }
    })
    cachedInventory = response.data
    lastFetchedInventory = Date.now()
    res.json(cachedInventory)
  } catch (error) {
    console.error(error.response?.status, error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
})
// ===================== End CSFloat Inventory endpoint =================
*/

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


// ===================== Wishlist endpoints =====================
app.get("/wishlist/:category", async (req, res) => {
    console.log("Hitting wishlist endpoint, category:", req.params.category)
  console.log("Supabase URL:", process.env.SUPABASE_URL)
  const { category } = req.params
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false })
    console.log("Supabase data:", data, "error:", error)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post("/wishlist", async (req, res) => {
  const { category, name, brand, price, image_url, link, notes } = req.body
  const { data, error } = await supabase
    .from("wishlist")
    .insert([{ category, name, brand, price, image_url, link, notes }])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

app.delete("/wishlist/:id", async (req, res) => {
  const { id } = req.params
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})
// ===================== End Wishlist endpoints =====================

// ===================== Matches sync endpoint =====================
app.post("/matches/sync", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api-public.cs-prod.leetify.com/v3/profile/matches",
      {
        params: { steam64_id: STEAM_ID },
        headers: {
          "X-Api-Key": API_KEY,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )
    const matches = response.data
    const toInsert = matches.map(m => ({
      id: m.id,
      finished_at: m.finished_at,
      map_name: m.map_name,
      data_source: m.data_source,
      replay_url: m.replay_url,
      team_scores: m.team_scores,
      stats: m.stats
    }))
    const { error } = await supabase
      .from("matches")
      .upsert(toInsert, { onConflict: "id" })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ synced: toInsert.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/matches/all", async (req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("finished_at", { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})
// ===================== End Matches sync endpoint =====================




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})