import { useState, useEffect } from "react"
import styles from "../styles/clothing.module.css"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis } from "recharts"

const RARITY_NAMES = {
  1: "Consumer", 2: "Industrial", 3: "Mil-Spec",
  4: "Restricted", 5: "Classified", 6: "Covert", 7: "Contraband"
}

const RARITY_COLORS = {
  Consumer: "#b0c3d9", Industrial: "#5e98d9", "Mil-Spec": "#4b69ff",
  Restricted: "#8847ff", Classified: "#d32ce6", Covert: "#eb4b4b", Contraband: "#e4ae39"
}

function normalizeItem(item) {
  return {
    assetId: item.asset_id,
    name: item.market_hash_name ?? "Unknown",
    itemName: item.item_name ?? "Unknown",
    wear: item.wear_name ?? "Unknown",
    float: item.float_value ?? null,
    rarity: RARITY_NAMES[item.rarity] ?? "Unknown",
    priceUSD: (item.scm?.price ?? 0) / 100,
    isStattrak: item.is_stattrak ?? false,
    iconUrl: item.icon_url
      ? `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}/120x80`
      : null,
  }
}

export default function Clothing() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState("priceUSD")
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState("")
  const [view, setView] = useState("overview")

  useEffect(() => {
    fetch("/csfloat/inventory")
      .then(r => r.json())
      .then(json => {
        setItems(json.map(normalizeItem))
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load inventory")
        setLoading(false)
      })
  }, [])

  if (loading) return <div className={styles.container}><p>Loading inventory...</p></div>
  if (error) return <div className={styles.container}><p>{error}</p></div>

  const totalValue = items.reduce((sum, i) => sum + i.priceUSD, 0)
  const avgValue = totalValue / items.length
  const mostValuable = [...items].sort((a, b) => b.priceUSD - a.priceUSD)[0]

  const rarityData = Object.entries(
    items.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] ?? 0) + item.priceUSD
      return acc
    }, {})
  ).map(([rarity, value]) => ({ name: rarity, value: parseFloat(value.toFixed(2)) }))

  const floatData = items
    .filter(i => i.float != null)
    .map(i => ({ x: parseFloat(i.float.toFixed(4)), y: parseFloat(i.priceUSD.toFixed(2)), name: i.itemName }))

  const filtered = items
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My CS2 Skins</h1>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={() => setView("overview")} className={view === "overview" ? styles.activeButton : styles.button}>Overview</button>
        <button onClick={() => setView("inventory")} className={view === "inventory" ? styles.activeButton : styles.button}>Inventory</button>
      </div>

      {view === "overview" && (
        <>
          {/* Summary Cards */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Portfolio Summary</h2>
            <div className={styles.grid}>
              <div className={styles.card}>
                <p className={styles.cardLabel}>Total Skins</p>
                <p className={styles.cardValue}>{items.length}</p>
              </div>
              <div className={styles.card}>
                <p className={styles.cardLabel}>Portfolio Value</p>
                <p className={styles.cardValue}>${totalValue.toFixed(2)}</p>
              </div>
              <div className={styles.card}>
                <p className={styles.cardLabel}>Avg Skin Value</p>
                <p className={styles.cardValue}>${avgValue.toFixed(2)}</p>
              </div>
              <div className={styles.card}>
                <p className={styles.cardLabel}>Most Valuable</p>
                <p className={styles.cardValue}>{mostValuable?.itemName}</p>
              </div>
            </div>
          </section>

          {/* Rarity Pie Chart */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Portfolio Value by Rarity</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={rarityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {rarityData.map((entry) => (
                      <Cell key={entry.name} fill={RARITY_COLORS[entry.name] ?? "#888"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                    formatter={(val) => `$${val.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Price vs Float Scatter */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Price vs Float</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                  <XAxis dataKey="x" type="number" domain={[0, 1]} name="Float" tick={{ fill: "#888", fontSize: 11 }}
                    label={{ value: "Float Value", position: "insideBottom", offset: -10, fill: "#888" }} />
                  <YAxis dataKey="y" name="Price (USD)" tick={{ fill: "#888", fontSize: 11 }}
                    label={{ value: "Price (USD)", angle: -90, position: "insideLeft", fill: "#888" }} />
                  <ZAxis range={[40, 40]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                    formatter={(val, name) => name === "Float" ? val.toFixed(6) : `$${val.toFixed(2)}`}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter data={floatData} fill="#f5c842" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {view === "inventory" && (
        <section className={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Inventory ({filtered.length})</h2>
            <input
              placeholder="Search skins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {[["icon", ""], ["itemName", "Skin"], ["wear", "Wear"], ["float", "Float"], ["rarity", "Rarity"], ["priceUSD", "Price"]].map(([key, label]) => (
                    <th key={key} onClick={() => label && handleSort(key)} className={styles.th}
                      style={{ cursor: label ? "pointer" : "default" }}>
                      {label}{label && sortKey === key ? (sortAsc ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.assetId} className={styles.tr}>
                    <td className={styles.td}>
                      {item.iconUrl
                        ? <img src={item.iconUrl} alt="" style={{ width: 60, height: 40, objectFit: "contain" }} />
                        : "—"}
                    </td>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                      {item.isStattrak && <div style={{ color: "#cf6a32", fontSize: "11px" }}>StatTrak™</div>}
                    </td>
                    <td className={styles.td}>{item.wear}</td>
                    <td className={styles.td}>{item.float?.toFixed(6) ?? "—"}</td>
                    <td className={styles.td}>
                      <span style={{ color: RARITY_COLORS[item.rarity] ?? "#888", fontWeight: 600 }}>
                        {item.rarity}
                      </span>
                    </td>
                    <td className={styles.td} style={{ color: "#4a7c4e", fontWeight: 600 }}>
                      ${item.priceUSD.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}