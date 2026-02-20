import { useState, useEffect } from "react"
import styles from "../styles/counterstrike.module.css"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function CS2() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const [matchesData, setMatchesData] = useState(null)
    
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
}).reverse()

    if (error) return <div className={styles.container}><p>{error}</p></div>
    if (!data) return <div className={styles.container}><p>Loading...</p></div>

    
    const { ranks, rating, stats, name, winrate, total_matches, recent_matches } = data
    const { aim, positioning, utility, clutch, opening } = rating ?? {}
    const leetifyRating = ranks?.leetify
    const competitiveRank = ranks?.competitive?.find(r => r.map_name === "de_mirage")?.rank 

    console.log("total matches:", matchesData?.length)
    console.log("first match date:", matchesData?.[0]?.finished_at)
    console.log("last match date:", matchesData?.[matchesData.length - 1]?.finished_at)

    


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My CS2 Stats</h1>

      {/* General Stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.grid}>
            <StatCard label="Name" value={name} />
            <StatCard label="Leetify Rating" value={leetifyRating?.toFixed(2)} />
            <StatCard label="Win Rate" value={`${(winrate * 100).toFixed(1)}%`} />
            <StatCard label="Total Matches" value={total_matches} />
            <StatCard label="Aim" value={aim?.toFixed(2)} />
            <StatCard label="Positioning" value={positioning?.toFixed(2)} />
            <StatCard label="Utility" value={utility?.toFixed(2)} />
            <StatCard label="Clutch" value={clutch?.toFixed(4)} />
            <StatCard label="Opening" value={opening?.toFixed(4)} />
        </div>
      </section>

      {/* Detailed Stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Detailed Stats</h2>
        <div className={styles.grid}>
          <StatCard label="Accuracy (Enemy Spotted)" value={`${stats?.accuracy_enemy_spotted?.toFixed(1)}%`} />
          <StatCard label="Headshot Accuracy" value={`${stats?.accuracy_head?.toFixed(1)}%`} />
          <StatCard label="Counter Strafing" value={`${stats?.counter_strafing_good_shots_ratio?.toFixed(1)}%`} />
          <StatCard label="Reaction Time" value={`${stats?.reaction_time_ms?.toFixed(0)}ms`} />
          <StatCard label="Spray Accuracy" value={`${stats?.spray_accuracy?.toFixed(1)}%`} />
          <StatCard label="CT Opening Success" value={`${stats?.ct_opening_duel_success_percentage?.toFixed(1)}%`} />
          <StatCard label="T Opening Success" value={`${stats?.t_opening_duel_success_percentage?.toFixed(1)}%`} />
          <StatCard label="Trade Kill Success" value={`${stats?.trade_kills_success_percentage?.toFixed(1)}%`} />
          <StatCard label="Flashbang Duration" value={`${stats?.flashbang_hit_foe_avg_duration?.toFixed(2)}s`} />
          <StatCard label="HE Grenade Damage" value={stats?.he_foes_damage_avg?.toFixed(1)} />
          <StatCard label="Utility on Death" value={stats?.utility_on_death_avg?.toFixed(0)} />
          <StatCard label="Preaim" value={`${stats?.preaim?.toFixed(1)}%`} />
        </div>
      </section>

        {/* Recent Matches */}
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

        {/* Reaction Time Chart */}
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
                <XAxis 
                dataKey="game" 
                label={{ value: "Match", position: "insideBottom", offset: -5, fill: "#a8b8a0" }}
                tick={{ fill: "#a8b8a0" }}
                />
                <YAxis
                label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#a8b8a0" }}
                tick={{ fill: "#a8b8a0" }}
                domain={["auto", "auto"]}
                />
                <Tooltip
                contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                labelStyle={{ color: "#a8b8a0" }}
                formatter={(value, name) => [`${value}ms`, "Reaction Time"]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.date ?? `Match ${label}`}
                />
                <Line 
                type="monotone" 
                dataKey="reaction_time" 
                stroke="#f5c842" 
                strokeWidth={2}
                dot={{ fill: "#f5c842", r: 3 }}
                activeDot={{ r: 6, fill: "#a8b8a0" }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
        </section>

        {/* Preaim Chart */}
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
                <XAxis
                dataKey="game"
                label={{ value: "Match", position: "insideBottom", offset: -5, fill: "#a8b8a0" }}
                tick={{ fill: "#a8b8a0" }}
                />
                <YAxis
                label={{ value: "%", angle: -90, position: "insideLeft", fill: "#a8b8a0" }}
                tick={{ fill: "#a8b8a0" }}
                domain={["auto", "auto"]}
                />
                <Tooltip
                contentStyle={{ backgroundColor: "#2c2c2c", border: "1px solid #f5c842", borderRadius: "8px" }}
                labelStyle={{ color: "#a8b8a0" }}
                formatter={(value) => [`${value?.toFixed(2)}%`, "Preaim"]}
                labelFormatter={(label, payload) => {
                const match = payload?.[0]?.payload
                return match ? `${match.date} — ${match.map}` : `Match ${label}`
                }}
                />
                <Line
                type="monotone"
                dataKey="preaim"
                stroke="#a8b8a0"
                strokeWidth={2}
                dot={{ fill: "#a8b8a0", r: 3 }}
                activeDot={{ r: 6, fill: "#f5c842" }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
        </section>

                {/* HS Kills */}
        <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Headshot Kills Per Match</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <LineChart data={myStats?.slice(0, 30)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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

        {/* K/D Ratio */}
        <section className={styles.section}>
        <h2 className={styles.sectionTitle}>K/D Ratio Per Match</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <LineChart data={myStats?.slice(0, 30)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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

        {/* Damage Per Round */}
        <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Damage Per Round</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <LineChart data={myStats?.slice(0, 30)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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

        {/* Trade Kill Success */}
        <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trade Kill Success %</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <LineChart data={myStats?.slice(0, 30)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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

        {/* Counter Strafing */}
        <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Counter Strafing Good Shot Ratio</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <LineChart data={myStats?.slice(0, 30)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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















    </div>

  )
}

function StatCard({ label, value }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{label}</p>
      <p className={styles.cardValue}>{value ?? "N/A"}</p>
    </div>
  )
}