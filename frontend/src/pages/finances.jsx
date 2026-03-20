/*
Author: Christopher Soule
Date: 03/18/2026
Finance tracking page with summary, transactions, accounts, subscriptions, and overview
Uses Supabase via backend endpoints for persistent storage
*/

import { useState, useEffect, useMemo } from "react"
import styles from "../styles/finances.module.css"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts"

const CATEGORIES = ["Restaurant", "Grocery", "Gas", "Clothing", "Home", "Personal Product", "Car", "Beer", "Transportation", "Videogame", "Other"]
const CATEGORY_COLORS = {
  "Restaurant": "#f54242", "Grocery": "#4caf50", "Gas": "#ff9800",
  "Clothing": "#9c27b0", "Home": "#2196f3", "Personal Product": "#00bcd4",
  "Car": "#795548", "Beer": "#ffc107", "Transportation": "#607d8b",
  "Videogame": "#e91e63", "Other": "#9e9e9e"
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const EMPTY_TX_FORM = { account_id: "", business: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "", needs_venmo: false, was_venmoed: false, category: "", tx_type: "debit" }
const EMPTY_SUB_FORM = { name: "", cost: "", cycle: "monthly", next_date: "", category: "", notes: "" }
const EMPTY_ACCOUNT_FORM = { name: "", type: "checking", balance: "" }

export default function Finances() {
  const [view, setView] = useState("summary")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── State ─────────────────────────────────────────────────
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [budgets, setBudgets] = useState({})

  const [selectedAccount, setSelectedAccount] = useState(null)
  const [editingTx, setEditingTx] = useState(null)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingAccountForm, setEditingAccountForm] = useState(EMPTY_ACCOUNT_FORM)
  const [editingSub, setEditingSub] = useState(null)
  const [editingSubForm, setEditingSubForm] = useState(EMPTY_SUB_FORM)
  const [showTxForm, setShowTxForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)

  const [txForm, setTxForm] = useState(EMPTY_TX_FORM)
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM)
  const [subForm, setSubForm] = useState(EMPTY_SUB_FORM)
  const [budgetInput, setBudgetInput] = useState("")

  // ── Load all data from Supabase on mount ──────────────────
  useEffect(() => {
    const loadAll = async () => {
    setLoading(true)
    setError(null)
      try {
        const [aRes, tRes, sRes, bRes] = await Promise.all([
          fetch("/finance/accounts"),
          fetch("/finance/transactions"),
          fetch("/finance/subscriptions"),
          fetch("/finance/budgets")
        ])
        const [a, t, s, b] = await Promise.all([aRes.json(), tRes.json(), sRes.json(), bRes.json()])
        setAccounts(a)
        setTransactions(t)
        setSubscriptions(s)
        // convert budgets array to { id: amount } map
        const budgetMap = {}
        b.forEach(entry => { budgetMap[entry.id] = entry.amount })
        setBudgets(budgetMap)
      } catch (err) {
        console.error("Load error:", err)
        setError("Failed to load finance data")
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  // ── Account Handlers ──────────────────────────────────────
  const handleAddAccount = async () => {
    if (!accountForm.name) return
    const newAccount = { id: Date.now().toString(), ...accountForm, balance: parseFloat(accountForm.balance) || 0 }
    try {
      const res = await fetch("/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount)
      })
      const saved = await res.json()
      setAccounts(prev => [...prev, saved])
      setAccountForm(EMPTY_ACCOUNT_FORM)
      setShowAccountForm(false)
    } catch { setError("Failed to add account") }
  }

  const handleSaveAccount = async (id) => {
    const updated = { ...editingAccountForm, balance: parseFloat(editingAccountForm.balance) || 0 }
    try {
      await fetch(`/finance/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
      setEditingAccount(null)
    } catch { setError("Failed to update account") }
  }

  const handleDeleteAccount = async (id) => {
    try {
      await fetch(`/finance/accounts/${id}`, { method: "DELETE" })
      setAccounts(prev => prev.filter(a => a.id !== id))
      setTransactions(prev => prev.filter(t => t.account_id !== id))
      if (selectedAccount === id) setSelectedAccount(null)
    } catch { setError("Failed to delete account") }
  }

  const handleEditAccountStart = (a) => {
    setEditingAccount(a.id)
    setEditingAccountForm({ name: a.name, type: a.type, balance: a.balance })
  }

  // ── Transaction Handlers ──────────────────────────────────
  const handleAddTx = async () => {
    if (!txForm.business || !txForm.amount || !txForm.account_id) return
    const amount = parseFloat(txForm.amount)
    const newTx = { id: Date.now().toString(), ...txForm, amount }
    const account = accounts.find(a => a.id === txForm.account_id)
    const delta = txForm.tx_type === "credit" ? amount : -amount
    const newBalance = parseFloat(((account?.balance ?? 0) + delta).toFixed(2))
    try {
      const res = await fetch("/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx)
      })
      const saved = await res.json()
      setTransactions(prev => [saved, ...prev])
      // update account balance in Supabase
      await fetch(`/finance/accounts/${txForm.account_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance })
      })
      setAccounts(prev => prev.map(a => a.id === txForm.account_id ? { ...a, balance: newBalance } : a))
      setTxForm(EMPTY_TX_FORM)
      setShowTxForm(false)
    } catch { setError("Failed to add transaction") }
  }

  const handleEditTx = (tx) => {
    setEditingTx(tx.id)
    setTxForm({ ...tx })
    setShowTxForm(true)
  }

  const handleSaveEditTx = async () => {
    if (!txForm.business || !txForm.amount) return
    const oldTx = transactions.find(t => t.id === editingTx)
    const newAmount = parseFloat(txForm.amount)
    const updatedTx = { ...txForm, amount: newAmount }
    try {
      await fetch(`/finance/transactions/${editingTx}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTx)
      })
      setTransactions(prev => prev.map(t => t.id === editingTx ? updatedTx : t))
      // reverse old balance effect and apply new
      if (oldTx?.account_id) {
        const oldDelta = oldTx.tx_type === "credit" ? -oldTx.amount : oldTx.amount
        const newDelta = txForm.tx_type === "credit" ? newAmount : -newAmount
        const account = accounts.find(a => a.id === oldTx.account_id)
        const newBalance = parseFloat(((account?.balance ?? 0) + oldDelta + newDelta).toFixed(2))
        await fetch(`/finance/accounts/${oldTx.account_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance })
        })
        setAccounts(prev => prev.map(a => a.id === oldTx.account_id ? { ...a, balance: newBalance } : a))
      }
      setTxForm(EMPTY_TX_FORM)
      setEditingTx(null)
      setShowTxForm(false)
    } catch { setError("Failed to update transaction") }
  }

  const handleDeleteTx = async (id) => {
    const tx = transactions.find(t => t.id === id)
    try {
      await fetch(`/finance/transactions/${id}`, { method: "DELETE" })
      setTransactions(prev => prev.filter(t => t.id !== id))
      // reverse balance effect
      if (tx?.account_id) {
        const delta = tx.tx_type === "credit" ? -tx.amount : tx.amount
        const account = accounts.find(a => a.id === tx.account_id)
        const newBalance = parseFloat(((account?.balance ?? 0) + delta).toFixed(2))
        await fetch(`/finance/accounts/${tx.account_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance })
        })
        setAccounts(prev => prev.map(a => a.id === tx.account_id ? { ...a, balance: newBalance } : a))
      }
    } catch { setError("Failed to delete transaction") }
  }

  // ── Subscription Handlers ─────────────────────────────────
  const handleAddSub = async () => {
    if (!subForm.name || !subForm.cost) return
    const newSub = { id: Date.now().toString(), ...subForm, cost: parseFloat(subForm.cost) }
    try {
      const res = await fetch("/finance/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub)
      })
      const saved = await res.json()
      setSubscriptions(prev => [...prev, saved])
      setSubForm(EMPTY_SUB_FORM)
      setShowSubForm(false)
    } catch { setError("Failed to add subscription") }
  }

  const handleEditSubStart = (s) => {
    setEditingSub(s.id)
    setEditingSubForm({ ...s })
  }

  const handleSaveEditSub = async () => {
    const updated = { ...editingSubForm, cost: parseFloat(editingSubForm.cost) || 0 }
    try {
      await fetch(`/finance/subscriptions/${editingSub}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      setSubscriptions(prev => prev.map(s => s.id === editingSub ? { ...s, ...updated } : s))
      setEditingSub(null)
    } catch { setError("Failed to update subscription") }
  }

  const handleDeleteSub = async (id) => {
    try {
      await fetch(`/finance/subscriptions/${id}`, { method: "DELETE" })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
    } catch { setError("Failed to delete subscription") }
  }

  // ── Budget Handlers ───────────────────────────────────────
  const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput) || 0
    try {
      await fetch("/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentMonthKey, amount })
      })
      setBudgets(prev => ({ ...prev, [currentMonthKey]: amount }))
      setBudgetInput("")
      setShowBudgetForm(false)
    } catch { setError("Failed to save budget") }
  }

  // ── Computed Values ───────────────────────────────────────
  const totalBalance = useMemo(() => accounts.reduce((sum, a) =>
    a.type === "credit" ? sum - a.balance : sum + a.balance, 0), [accounts])

  const visibleTransactions = useMemo(() => {
    const base = selectedAccount
      ? transactions.filter(t => t.account_id === selectedAccount)
      : transactions
    return [...base].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, selectedAccount])

  const monthlySpending = useMemo(() => {
    const now = new Date()
    return MONTHS.map((month, i) => {
      const total = transactions
        .filter(t => {
          const d = new Date(t.date)
          return d.getFullYear() === now.getFullYear() && d.getMonth() === i && t.tx_type !== "credit"
        })
        .reduce((sum, t) => sum + t.amount, 0)
      return { month, total: parseFloat(total.toFixed(2)) }
    })
  }, [transactions])

  const currentMonthSpending = monthlySpending[new Date().getMonth()]?.total ?? 0
  const lastMonthSpending = monthlySpending[new Date().getMonth() - 1]?.total ?? 0
  const spendingChange = lastMonthSpending > 0
    ? (((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100).toFixed(1)
    : null
  const currentBudget = budgets[currentMonthKey] ?? 0
  const budgetPercent = currentBudget > 0 ? Math.min((currentMonthSpending / currentBudget) * 100, 100).toFixed(0) : 0

  const totalMonthlySubCost = subscriptions.reduce((sum, s) =>
    s.cycle === "yearly" ? sum + s.cost / 12 : sum + s.cost, 0)

  const categorySpending = useMemo(() => {
    const map = {}
    transactions.filter(t => t.tx_type !== "credit").forEach(t => {
      const cat = t.category || "Other"
      map[cat] = (map[cat] ?? 0) + t.amount
    })
    return Object.entries(map).map(([cat, total]) => ({
      cat, name: cat,
      total: parseFloat(total.toFixed(2)),
      value: parseFloat(total.toFixed(2)),
      fill: CATEGORY_COLORS[cat] ?? "#9e9e9e"
    })).sort((a, b) => b.total - a.total)
  }, [transactions])

  const accountSpending = useMemo(() => accounts.map(a => ({
    name: a.name,
    total: transactions.filter(t => t.account_id === a.id && t.tx_type !== "credit").reduce((sum, t) => sum + t.amount, 0)
  })), [accounts, transactions])

  const selectedAccountObj = accounts.find(a => a.id === txForm.account_id)

  if (loading) return <div className={styles.container}><p>Loading finances...</p></div>
  if (error) return <div className={styles.container}><p style={{ color: "#e57373" }}>{error}</p></div>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Finances</h1>

      {/* Nav */}
      <div className={styles.nav}>
        {["summary", "transactions", "accounts", "subscriptions", "overview"].map(v => (
          <button key={v} onClick={() => setView(v)} className={view === v ? styles.activeButton : styles.button}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {view === "summary" && (
        <>
          <div className={styles.cardGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Net worth</p>
              <p className={styles.metricVal} style={{ color: totalBalance >= 0 ? "#4a7c4e" : "#e57373" }}>
                ${totalBalance.toFixed(2)}
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Accounts</p>
              <p className={styles.metricVal}>{accounts.length}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Monthly subscriptions</p>
              <p className={styles.metricVal} style={{ color: "#e57373" }}>${totalMonthlySubCost.toFixed(2)}/mo</p>
            </div>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Accounts</h2>
            {accounts.length === 0 && <p className={styles.empty}>No accounts yet. Go to Accounts to add one.</p>}
            <div className={styles.accountSummaryList}>
              {accounts.map(a => (
                <div key={a.id} className={styles.accountSummaryItem}>
                  <div>
                    <p className={styles.accountSummaryType}>{a.type}</p>
                    <p className={styles.accountSummaryName}>{a.name}</p>
                  </div>
                  <p className={styles.accountSummaryBalance} style={{ color: a.type === "credit" ? "#e57373" : "#4a7c4e" }}>
                    ${a.balance.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── TRANSACTIONS ── */}
      {view === "transactions" && (
        <div className={styles.txLayout}>
          <div className={styles.txSidebar}>
            <p className={styles.sectionTitle}>Accounts</p>
            <div
              className={`${styles.sidebarItem} ${!selectedAccount ? styles.sidebarItemActive : ""}`}
              onClick={() => setSelectedAccount(null)}
            >
              All accounts
            </div>
            {accounts.map(a => (
              <div
                key={a.id}
                className={`${styles.sidebarItem} ${selectedAccount === a.id ? styles.sidebarItemActive : ""}`}
                onClick={() => setSelectedAccount(a.id)}
              >
                <span>{a.name}</span>
                <span className={styles.sidebarType}>{a.type}</span>
              </div>
            ))}
          </div>

          <div className={styles.txPanel}>
            <div className={styles.txPanelHeader}>
              <div>
                <p className={styles.txPanelTitle}>
                  {selectedAccount ? accounts.find(a => a.id === selectedAccount)?.name : "All Transactions"}
                </p>
                <p className={styles.txPanelSub}>{visibleTransactions.length} transactions</p>
              </div>
              <button className={styles.addButton} onClick={() => { setShowTxForm(s => !s); setEditingTx(null); setTxForm(EMPTY_TX_FORM) }}>
                {showTxForm && !editingTx ? "Cancel" : "+ Add Transaction"}
              </button>
            </div>

            {showTxForm && (
              <div className={styles.form}>
                <h3 className={styles.formTitle}>{editingTx ? "Edit Transaction" : "Add Transaction"}</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Account</label>
                    <select className={styles.input} value={txForm.account_id} onChange={e => setTxForm(f => ({ ...f, account_id: e.target.value }))}>
                      <option value="">Select account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Type</label>
                    <select
                      className={styles.input}
                      value={txForm.tx_type}
                      onChange={e => setTxForm(f => ({ ...f, tx_type: e.target.value }))}
                      disabled={selectedAccountObj?.type === "credit"}
                    >
                      <option value="debit">Debit (money out)</option>
                      {selectedAccountObj?.type !== "credit" && (
                        <option value="credit">Credit (money in)</option>
                      )}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Business *</label>
                    <input className={styles.input} placeholder="e.g. Chipotle" value={txForm.business} onChange={e => setTxForm(f => ({ ...f, business: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount *</label>
                    <input className={styles.input} type="number" placeholder="0.00" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Date</label>
                    <input className={styles.input} type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes</label>
                    <input className={styles.input} placeholder="Optional" value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <div className={styles.categoryGrid}>
                    {CATEGORIES.map(cat => (
                      <label key={cat} className={styles.checkboxLabel}>
                        <input type="radio" name="category" value={cat} checked={txForm.category === cat} onChange={() => setTxForm(f => ({ ...f, category: cat }))} className={styles.checkbox} />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Venmo</label>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={txForm.needs_venmo} onChange={e => setTxForm(f => ({ ...f, needs_venmo: e.target.checked }))} className={styles.checkbox} />
                      Needs Venmo
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={txForm.was_venmoed} onChange={e => setTxForm(f => ({ ...f, was_venmoed: e.target.checked }))} className={styles.checkbox} />
                      Was Venmoed
                    </label>
                  </div>
                </div>
                <button className={styles.submitButton} onClick={editingTx ? handleSaveEditTx : handleAddTx}>
                  {editingTx ? "Save Changes" : "Add Transaction"}
                </button>
                {editingTx && (
                  <button className={styles.cancelButton} onClick={() => { setEditingTx(null); setShowTxForm(false); setTxForm(EMPTY_TX_FORM) }}>
                    Cancel
                  </button>
                )}
              </div>
            )}

            {visibleTransactions.length === 0 && !showTxForm && <p className={styles.empty}>No transactions yet.</p>}

            {visibleTransactions.map(t => (
              <div key={t.id} className={styles.txItem}>
                <div className={styles.txLeft}>
                  <p className={styles.txBusiness}>{t.business}</p>
                  <p className={styles.txMeta}>
                    {t.date}{t.category && ` · ${t.category}`}{t.notes && ` · ${t.notes}`}
                    {!selectedAccount && t.account_id && ` · ${accounts.find(a => a.id === t.account_id)?.name ?? ""}`}
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                    {t.needs_venmo && <span className={styles.venmoBadge}>Needs Venmo</span>}
                    {t.was_venmoed && <span className={styles.venmoedBadge}>Venmoed</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className={styles.txAmount} style={{ color: t.tx_type === "credit" ? "#4a7c4e" : "#e57373" }}>
                    {t.tx_type === "credit" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                    <button className={styles.editButton} onClick={() => handleEditTx(t)}>Edit</button>
                    <button className={styles.deleteButton} onClick={() => handleDeleteTx(t.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACCOUNTS ── */}
      {view === "accounts" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Accounts</h2>
            <button className={styles.addButton} onClick={() => setShowAccountForm(s => !s)}>
              {showAccountForm ? "Cancel" : "+ Add Account"}
            </button>
          </div>

          {showAccountForm && (
            <div className={styles.form}>
              <h3 className={styles.formTitle}>Add Account</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input className={styles.input} placeholder="e.g. Chase Checking" value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Type</label>
                  <select className={styles.input} value={accountForm.type} onChange={e => setAccountForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Balance</label>
                  <input className={styles.input} type="number" placeholder="0.00" value={accountForm.balance} onChange={e => setAccountForm(f => ({ ...f, balance: e.target.value }))} />
                </div>
              </div>
              <button className={styles.submitButton} onClick={handleAddAccount}>Add Account</button>
            </div>
          )}

          {accounts.length === 0 && !showAccountForm && <p className={styles.empty}>No accounts yet.</p>}

          <div className={styles.accountSummaryList}>
            {accounts.map(a => (
              <div key={a.id} className={styles.accountSummaryItem}>
                {editingAccount === a.id ? (
                  <div style={{ flex: 1 }}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input className={styles.input} value={editingAccountForm.name} onChange={e => setEditingAccountForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Type</label>
                        <select className={styles.input} value={editingAccountForm.type} onChange={e => setEditingAccountForm(f => ({ ...f, type: e.target.value }))}>
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                          <option value="credit">Credit Card</option>
                          <option value="investment">Investment</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Balance</label>
                        <input className={styles.input} type="number" value={editingAccountForm.balance} onChange={e => setEditingAccountForm(f => ({ ...f, balance: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className={styles.submitButton} onClick={() => handleSaveAccount(a.id)}>Save</button>
                      <button className={styles.cancelButton} onClick={() => setEditingAccount(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className={styles.accountSummaryType}>{a.type}</p>
                      <p className={styles.accountSummaryName}>{a.name}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className={styles.accountSummaryBalance} style={{ color: a.type === "credit" ? "#e57373" : "#4a7c4e" }}>
                        ${a.balance.toFixed(2)}
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.2rem" }}>
                        <button className={styles.editButton} onClick={() => handleEditAccountStart(a)}>Edit</button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteAccount(a.id)}>Remove</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {view === "subscriptions" && (
        <>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Subscriptions</h2>
              <p className={styles.subTotal}>Total: ${totalMonthlySubCost.toFixed(2)}/mo · ${(totalMonthlySubCost * 12).toFixed(2)}/yr</p>
            </div>
            <button className={styles.addButton} onClick={() => setShowSubForm(s => !s)}>
              {showSubForm ? "Cancel" : "+ Add Subscription"}
            </button>
          </div>

          {showSubForm && (
            <div className={styles.form}>
              <h3 className={styles.formTitle}>Add Subscription</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name *</label>
                  <input className={styles.input} placeholder="e.g. Netflix" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cost *</label>
                  <input className={styles.input} type="number" placeholder="0.00" value={subForm.cost} onChange={e => setSubForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Billing Cycle</label>
                  <select className={styles.input} value={subForm.cycle} onChange={e => setSubForm(f => ({ ...f, cycle: e.target.value }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Next Billing Date</label>
                  <input className={styles.input} type="date" value={subForm.next_date} onChange={e => setSubForm(f => ({ ...f, next_date: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <input className={styles.input} placeholder="e.g. Entertainment" value={subForm.category} onChange={e => setSubForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Notes</label>
                  <input className={styles.input} placeholder="Optional" value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <button className={styles.submitButton} onClick={handleAddSub}>Add Subscription</button>
            </div>
          )}

          {subscriptions.length === 0 && !showSubForm && <p className={styles.empty}>No subscriptions yet.</p>}

          <div className={styles.subList}>
            {subscriptions.map(s => (
              <div key={s.id} className={styles.subCard}>
                {editingSub === s.id ? (
                  <div style={{ flex: 1 }}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input className={styles.input} value={editingSubForm.name} onChange={e => setEditingSubForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Cost</label>
                        <input className={styles.input} type="number" value={editingSubForm.cost} onChange={e => setEditingSubForm(f => ({ ...f, cost: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Billing Cycle</label>
                        <select className={styles.input} value={editingSubForm.cycle} onChange={e => setEditingSubForm(f => ({ ...f, cycle: e.target.value }))}>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Next Billing Date</label>
                        <input className={styles.input} type="date" value={editingSubForm.next_date} onChange={e => setEditingSubForm(f => ({ ...f, next_date: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        <input className={styles.input} value={editingSubForm.category} onChange={e => setEditingSubForm(f => ({ ...f, category: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Notes</label>
                        <input className={styles.input} value={editingSubForm.notes} onChange={e => setEditingSubForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className={styles.submitButton} onClick={handleSaveEditSub}>Save</button>
                      <button className={styles.cancelButton} onClick={() => setEditingSub(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.subCardLeft}>
                      <p className={styles.subName}>{s.name}</p>
                      <p className={styles.subMeta}>
                        {s.cycle === "yearly" ? "Yearly" : "Monthly"}{s.category && ` · ${s.category}`}
                        {s.next_date && ` · Next: ${s.next_date}`}
                      </p>
                      {s.notes && <p className={styles.subNotes}>{s.notes}</p>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className={styles.subCost}>${s.cost.toFixed(2)}/{s.cycle === "yearly" ? "yr" : "mo"}</p>
                      {s.cycle === "yearly" && <p className={styles.subMonthly}>${(s.cost / 12).toFixed(2)}/mo</p>}
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                        <button className={styles.editButton} onClick={() => handleEditSubStart(s)}>Edit</button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteSub(s.id)}>Remove</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── OVERVIEW ── */}
      {view === "overview" && (
        <div className={styles.overviewLayout}>
          <div className={styles.overviewStats}>
            <div className={styles.overviewStatCard}>
              <p className={styles.metricLabel}>This month</p>
              <p className={styles.metricVal} style={{ color: "#e57373" }}>${currentMonthSpending.toFixed(2)}</p>
            </div>
            <div className={styles.overviewStatCard}>
              <p className={styles.metricLabel}>Budget</p>
              <p className={styles.metricVal}>${currentBudget.toFixed(2)}</p>
              <button className={styles.setBudgetBtn} onClick={() => { setBudgetInput(currentBudget || ""); setShowBudgetForm(s => !s) }}>
                {showBudgetForm ? "Cancel" : "Set budget"}
              </button>
              {showBudgetForm && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input className={styles.input} type="number" placeholder="0.00" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} style={{ maxWidth: "120px" }} />
                  <button className={styles.submitButton} onClick={handleSaveBudget}>Save</button>
                </div>
              )}
            </div>
            <div className={styles.overviewStatCard}>
              <p className={styles.metricLabel}>vs last month</p>
              <p className={styles.metricVal} style={{ color: spendingChange > 0 ? "#e57373" : "#4a7c4e" }}>
                {spendingChange !== null ? `${spendingChange > 0 ? "+" : ""}${spendingChange}%` : "—"}
              </p>
            </div>
            <div className={styles.overviewStatCard}>
              <p className={styles.metricLabel}>Budget used</p>
              <p className={styles.metricVal} style={{ color: budgetPercent > 90 ? "#e57373" : budgetPercent > 70 ? "#f5c842" : "#4a7c4e" }}>
                {budgetPercent}%
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${budgetPercent}%`, background: budgetPercent > 90 ? "#e57373" : budgetPercent > 70 ? "#f5c842" : "#a8b8a0" }} />
              </div>
            </div>
          </div>

          <div className={styles.overviewChartCard}>
            <p className={styles.overviewChartTitle}>Monthly spending — {new Date().getFullYear()}</p>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={monthlySpending} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                  <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                    formatter={v => [`$${v.toFixed(2)}`, "Spending"]}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {monthlySpending.map((entry, i) => (
                      <Cell key={i} fill={i === new Date().getMonth() ? "#a8b8a0" : "#e0e8dc"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.overviewBottomGrid}>
            <div className={styles.overviewChartCard}>
              <p className={styles.overviewChartTitle}>Spending by category</p>
              {categorySpending.length === 0 && <p className={styles.empty}>No transactions yet.</p>}
              {categorySpending.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {categorySpending.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                      formatter={v => [`$${v.toFixed(2)}`]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={styles.overviewChartCard}>
              <p className={styles.overviewChartTitle}>Spending by account</p>
              {accountSpending.length === 0 && <p className={styles.empty}>No accounts yet.</p>}
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={accountSpending} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 11 }} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px" }}
                      formatter={v => [`$${v.toFixed(2)}`, "Spent"]}
                    />
                    <Bar dataKey="total" fill="#a8b8a0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}