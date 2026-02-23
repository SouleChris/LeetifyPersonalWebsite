import { useState, useEffect } from "react"
import styles from "../styles/counterstrike.module.css"
import { LineChart, Line, ScatterChart, Scatter, ZAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function CS2() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [matchesData, setMatchesData] = useState(null)
  const [view, setView] = useState("overview")

  useEffect(() => {
    fetch("/leetify/matches")
      .then(r => r.json())
      .then(json => setMatchesData(json))
      .catch(() => setError("Failed to load matches"))
  }, [])

  useEffect(() => {
    fetch("/leetify")
      .then(r => r.json())
      .then(json => setData(json))
      .catch(() => setError("Failed to load data"))
  }, [])

  const myStats = matchesData?.slice(0, 30).map((match, i) => {
    const me = match.stats?.find(p => p.steam64_id === "76561198190351278")
    return {
      game: i + 1,
      date: new Date(match.finished_at).toLocaleDateString(),
      map: match.map_name,
      hs_kills: me?.total_hs_kills,
      kd: me?.kd_ratio,
      dpr: me?.dpr,
      trade_kill: me?.trade_kills_success_percentage,
      counter_strafing: me?.counter_strafing_shots_good_ratio,
    }
  })

  const recentByMap = (data?.recent_matches ?? []).reduce((acc, match) => {
    const map = match.map_name?.replace("de_", "").replace("cs_", "")
    if (!acc[map]) acc[map] = []
    acc[map].push(match.reaction_time_ms ?? 0)
    return acc
  }, {})

  const mapStats = matchesData ? Object.values(
    matchesData.reduce((acc, match) => {
      const me = match.stats?.find(p => p.steam64_id === "76561198190351278")
      if (!me) return acc
      const map = match.map_name
      const mapShort = map.replace("de_", "").replace("cs_", "")
      if (!acc[mapShort]) {
        acc[mapShort] = { map: mapShort, kd: [], dpr: [], hs_kills: [], trade_kill: [], preaim: [], count: 0 }
      }
      acc[mapShort].kd.push(me.kd_ratio ?? 0)
      acc[mapShort].dpr.push(me.dpr ?? 0)
      acc[mapShort].hs_kills.push(me.total_hs_kills ?? 0)
      acc[mapShort].trade_kill.push(me.trade_kills_success_percentage ?? 0)
      acc[mapShort].preaim.push(me.preaim ?? 0)
      acc[mapShort].count++
      return acc
    }, {})
  ).map(m => ({
    map: m.map,
    kd: (m.kd.reduce((a, b) => a + b, 0) / m.kd.length).toFixed(2),
    dpr: (m.dpr.reduce((a, b) => a + b, 0) / m.dpr.length).toFixed(1),
    hs_kills: (m.hs_kills.reduce((a, b) => a + b, 0) / m.hs_kills.length).toFixed(1),
    trade_kill: ((m.trade_kill.reduce((a, b) => a + b, 0) / m.trade_kill.length) * 100).toFixed(1),
    preaim: (m.preaim.reduce((a, b) => a + b, 0) / m.preaim.length).toFixed(1),
    reaction_time: recentByMap[m.map]
      ? (recentByMap[m.map].reduce((a, b) => a + b, 0) / recentByMap[m.map].length).toFixed(0)
      : null,
    count: m.count
  })).sort((a, b) => b.count - a.count) : []

  if (error) return <div className={styles.container}><p>{error}</p></div>
  if (!data) return <div className={styles.container}><p>Loading...</p></div>
  if (!matchesData) return <div className={styles.container}><p>Loading matches...</p></div>

  const { ranks, rating, stats, name, winrate, total_matches, recent_matches } = data
  const { aim, positioning, utility, clutch, opening } = rating ?? {}
  const leetifyRating = ranks?.leetify

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My CS2 Stats</h1>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={() => setView("overview")} className={view === "overview" ? styles.activeButton : styles.button}>
          Overview
        </button>
        <button onClick={() => setView("recent")} className={view === "recent" ? styles.activeButton : styles.button}>
          Recent Matches
        </button>
        <button onClick={() => setView("map")} className={view === "map" ? styles.activeButton : styles.button}>
          Per Map
        </button>
      </div>

      {/* Overview View */}
      {view === "overview" && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <div className={styles.grid}>
              <StatCard label="Name" value={name} />
              <StatCard label="Leetify Rating" value={leetifyRating?.toFixed(2)} rating={leetifyRating > 4 ? "excellent" : leetifyRating > 2.5 ? "good" : leetifyRating > 1 ? "average" : "poor"} />
              <StatCard label="Win Rate" value={`${(winrate * 100).toFixed(1)}%`} rating={winrate > 0.55 ? "excellent" : winrate > 0.5 ? "good" : winrate > 0.45 ? "average" : "poor"} />
              <StatCard label="Total Matches" value={total_matches} />
              <StatCard label="Aim" value={aim?.toFixed(2)} rating={aim > 70 ? "excellent" : aim > 55 ? "good" : aim > 40 ? "average" : "poor"} />
              <StatCard label="Positioning" value={positioning?.toFixed(2)} rating={positioning > 70 ? "excellent" : positioning > 55 ? "good" : positioning > 40 ? "average" : "poor"} />
              <StatCard label="Utility" value={utility?.toFixed(2)} rating={utility > 70 ? "excellent" : utility > 55 ? "good" : utility > 40 ? "average" : "poor"} />
              <StatCard label="Clutch" value={clutch?.toFixed(4)} rating={clutch > 0.15 ? "excellent" : clutch > 0.1 ? "good" : clutch > 0.05 ? "average" : "poor"} />
              <StatCard label="Opening" value={opening?.toFixed(4)} rating={opening > 0.08 ? "excellent" : opening > 0.05 ? "good" : opening > 0.02 ? "average" : "poor"} />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Detailed Stats</h2>
            <div className={styles.grid}>
              <StatCard label="Accuracy (Enemy Spotted)" value={`${stats?.accuracy_enemy_spotted?.toFixed(1)}%`} rating={stats?.accuracy_enemy_spotted > 40 ? "excellent" : stats?.accuracy_enemy_spotted > 30 ? "good" : stats?.accuracy_enemy_spotted > 20 ? "average" : "poor"} />
              <StatCard label="Headshot Accuracy" value={`${stats?.accuracy_head?.toFixed(1)}%`} rating={stats?.accuracy_head > 30 ? "excellent" : stats?.accuracy_head > 22 ? "good" : stats?.accuracy_head > 15 ? "average" : "poor"} />
              <StatCard label="Counter Strafing" value={`${stats?.counter_strafing_good_shots_ratio?.toFixed(1)}%`} rating={stats?.counter_strafing_good_shots_ratio > 85 ? "excellent" : stats?.counter_strafing_good_shots_ratio > 70 ? "good" : stats?.counter_strafing_good_shots_ratio > 55 ? "average" : "poor"} />
              <StatCard label="Reaction Time" value={`${stats?.reaction_time_ms?.toFixed(0)}ms`} rating={stats?.reaction_time_ms < 400 ? "excellent" : stats?.reaction_time_ms < 500 ? "good" : stats?.reaction_time_ms < 600 ? "average" : "poor"} />
              <StatCard label="Spray Accuracy" value={`${stats?.spray_accuracy?.toFixed(1)}%`} rating={stats?.spray_accuracy > 45 ? "excellent" : stats?.spray_accuracy > 35 ? "good" : stats?.spray_accuracy > 25 ? "average" : "poor"} />
              <StatCard label="CT Opening Success" value={`${stats?.ct_opening_duel_success_percentage?.toFixed(1)}%`} rating={stats?.ct_opening_duel_success_percentage > 55 ? "excellent" : stats?.ct_opening_duel_success_percentage > 45 ? "good" : stats?.ct_opening_duel_success_percentage > 35 ? "average" : "poor"} />
              <StatCard label="T Opening Success" value={`${stats?.t_opening_duel_success_percentage?.toFixed(1)}%`} rating={stats?.t_opening_duel_success_percentage > 55 ? "excellent" : stats?.t_opening_duel_success_percentage > 45 ? "good" : stats?.t_opening_duel_success_percentage > 35 ? "average" : "poor"} />
              <StatCard label="Trade Kill Success" value={`${stats?.trade_kills_success_percentage?.toFixed(1)}%`} rating={stats?.trade_kills_success_percentage > 45 ? "excellent" : stats?.trade_kills_success_percentage > 35 ? "good" : stats?.trade_kills_success_percentage > 25 ? "average" : "poor"} />
              <StatCard label="Flashbang Duration" value={`${stats?.flashbang_hit_foe_avg_duration?.toFixed(2)}s`} rating={stats?.flashbang_hit_foe_avg_duration > 3 ? "excellent" : stats?.flashbang_hit_foe_avg_duration > 2 ? "good" : stats?.flashbang_hit_foe_avg_duration > 1 ? "average" : "poor"} />
              <StatCard label="HE Grenade Damage" value={stats?.he_foes_damage_avg?.toFixed(1)} rating={stats?.he_foes_damage_avg > 20 ? "excellent" : stats?.he_foes_damage_avg > 12 ? "good" : stats?.he_foes_damage_avg > 6 ? "average" : "poor"} />
              <StatCard label="Utility on Death" value={stats?.utility_on_death_avg?.toFixed(0)} rating={stats?.utility_on_death_avg < 100 ? "excellent" : stats?.utility_on_death_avg < 250 ? "good" : stats?.utility_on_death_avg < 400 ? "average" : "poor"} />
              <StatCard label="Preaim" value={`${stats?.preaim?.toFixed(1)}%`} rating={stats?.preaim > 15 ? "excellent" : stats?.preaim > 10 ? "good" : stats?.preaim > 5 ? "average" : "poor"} />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Matches</h2>
            <div className={styles.matches}>
              {recent_matches?.slice(0, 5).map((match, i) => (
                <div key={i} className={`${styles.matchCard} ${match.outcome === "win" ? styles.win : styles.loss}`}>
                  <p className={styles.matchMap}>{match.map_name}</p>
                  <p className={styles.matchOutcome}>{match.outcome.toUpperCase()}</p>
                  <p className={styles.matchStat}>Rating: {match.leetify_rating?.toFixed(2)}</p>
                  <p className={styles.matchStat}>Rank: {match.rank}</p>
                  <p className={styles.matchStat}>{new Date(match.finished_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Recent Match Charts */}
      {view === "recent" && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Reaction Time — Last 30 Matches</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={recent_matches?.slice(0, 30).reverse().map((match, i) => ({
                    game: i + 1,
                    reaction_time: match.reaction_time_ms,
                    map: match.map_name,
                    date: new Date(match.finished_at).toLocaleDateString()
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" label={{ value: "Match", position: "insideBottom", offset: -5, fill: "#a8b8a0" }} tick={{ fill: "#a8b8a0" }} />
                  <YAxis label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#a8b8a0" }} tick={{ fill: "#a8b8a0" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [`${value}ms`, "Reaction Time"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date ?? `Match ${label}`}
                  />
                  <Line type="monotone" dataKey="reaction_time" stroke="#f5c842" strokeWidth={2} dot={{ fill: "#f5c842", r: 3 }} activeDot={{ r: 6, fill: "#a8b8a0" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Preaim — Last 30 Matches</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={recent_matches?.slice(0, 30).reverse().map((match, i) => ({
                    game: i + 1,
                    preaim: match.preaim,
                    map: match.map_name,
                    date: new Date(match.finished_at).toLocaleDateString()
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" label={{ value: "Match", position: "insideBottom", offset: -5, fill: "#a8b8a0" }} tick={{ fill: "#a8b8a0" }} />
                  <YAxis label={{ value: "%", angle: -90, position: "insideLeft", fill: "#a8b8a0" }} tick={{ fill: "#a8b8a0" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [`${value?.toFixed(2)}%`, "Preaim"]}
                    labelFormatter={(label, payload) => {
                      const match = payload?.[0]?.payload
                      return match ? `${match.date} — ${match.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="preaim" stroke="#a8b8a0" strokeWidth={2} dot={{ fill: "#a8b8a0", r: 3 }} activeDot={{ r: 6, fill: "#f5c842" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Headshot Kills Per Match</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={myStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" tick={{ fill: "#a8b8a0" }} />
                  <YAxis tick={{ fill: "#a8b8a0" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [value, "HS Kills"]}
                    labelFormatter={(label, payload) => {
                      const m = payload?.[0]?.payload
                      return m ? `${m.date} — ${m.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="hs_kills" stroke="#f5c842" strokeWidth={2} dot={{ fill: "#f5c842", r: 3 }} activeDot={{ r: 6, fill: "#a8b8a0" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>K/D Ratio Per Match</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={myStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" tick={{ fill: "#a8b8a0" }} />
                  <YAxis tick={{ fill: "#a8b8a0" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [value?.toFixed(2), "K/D"]}
                    labelFormatter={(label, payload) => {
                      const m = payload?.[0]?.payload
                      return m ? `${m.date} — ${m.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="kd" stroke="#a8b8a0" strokeWidth={2} dot={{ fill: "#a8b8a0", r: 3 }} activeDot={{ r: 6, fill: "#f5c842" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Damage Per Round</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={myStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" tick={{ fill: "#a8b8a0" }} />
                  <YAxis tick={{ fill: "#a8b8a0" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [value?.toFixed(1), "DPR"]}
                    labelFormatter={(label, payload) => {
                      const m = payload?.[0]?.payload
                      return m ? `${m.date} — ${m.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="dpr" stroke="#f5c842" strokeWidth={2} dot={{ fill: "#f5c842", r: 3 }} activeDot={{ r: 6, fill: "#a8b8a0" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Trade Kill Success %</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={myStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" tick={{ fill: "#a8b8a0" }} />
                  <YAxis tick={{ fill: "#a8b8a0" }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Trade Kill Success"]}
                    labelFormatter={(label, payload) => {
                      const m = payload?.[0]?.payload
                      return m ? `${m.date} — ${m.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="trade_kill" stroke="#a8b8a0" strokeWidth={2} dot={{ fill: "#a8b8a0", r: 3 }} activeDot={{ r: 6, fill: "#f5c842" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Counter Strafing Good Shot Ratio</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={myStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="game" tick={{ fill: "#a8b8a0" }} />
                  <YAxis tick={{ fill: "#a8b8a0" }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                    labelStyle={{ color: "#a8b8a0" }}
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Counter Strafing"]}
                    labelFormatter={(label, payload) => {
                      const m = payload?.[0]?.payload
                      return m ? `${m.date} — ${m.map}` : `Match ${label}`
                    }}
                  />
                  <Line type="monotone" dataKey="counter_strafing" stroke="#f5c842" strokeWidth={2} dot={{ fill: "#f5c842", r: 3 }} activeDot={{ r: 6, fill: "#a8b8a0" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {/* Per Map Charts */}
      {view === "map" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Stats By Map</h2>
          {[
            { key: "kd", label: "K/D Ratio", color: "#f5c842" },
            { key: "dpr", label: "Damage Per Round", color: "#a8b8a0" },
            { key: "hs_kills", label: "Avg Headshot Kills", color: "#f5c842" },
            { key: "trade_kill", label: "Trade Kill Success %", color: "#a8b8a0" },
            { key: "preaim", label: "Preaim", color: "#a8b8a0" },
            { key: "reaction_time", label: "Reaction Time (ms)", color: "#f5c842" },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ marginBottom: "2rem" }}>
              <h3 style={{ color: "#888", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.75rem" }}>{label}</h3>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                    <XAxis dataKey="map" type="category" tick={{ fill: "#888", fontSize: 12 }} allowDuplicatedCategory={false} />
                    <YAxis dataKey={key} type="number" tick={{ fill: "#888", fontSize: 12 }} domain={["auto", "auto"]} />
                    <ZAxis dataKey="count" range={[40, 200]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                      labelStyle={{ color: "#2c2c2c" }}
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => {
                        if (name === "count") return [value, "Matches played"]
                        return [value, label]
                      }}
                    />
                    <Scatter data={mapStats} fill={color} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </section>
      )}

    </div>
  )
}

function StatCard({ label, value, rating }) {
  const tierClass = rating === "excellent" ? styles.excellent
    : rating === "good" ? styles.good
    : rating === "average" ? styles.average
    : rating === "poor" ? styles.poor
    : ""

  return (
    <div className={`${styles.card} ${tierClass}`}>
      <p className={styles.cardLabel}>{label}</p>
      <p className={styles.cardValue}>{value ?? "N/A"}</p>
    </div>
  )
}