import { useState, useEffect } from "react"

const holdings = [
  { symbol: "SWPPX", shares: 10 },
  { symbol: "TSLA", shares: 5 },
  { symbol: "MSFT", shares: 8 },
]

function StockRow({ symbol, shares }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`/stock/${symbol}`)
      .then(r => r.json())
      .then(json => {
        const meta = json.chart.result[0].meta
        setData({
          price: meta.regularMarketPrice,
          change: (meta.regularMarketPrice - meta.previousClose).toFixed(2),
          changePercent: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2),
        })
      })
  }, [symbol])

  if (!data) return <tr><td colSpan="5">Loading {symbol}...</td></tr>

  const isPositive = data.change >= 0

  return (
    <tr>
      <td>{symbol}</td>
      <td>{shares}</td>
      <td>${data.price.toFixed(2)}</td>
      <td style={{ color: isPositive ? "green" : "red" }}>
        {isPositive ? "+" : ""}{data.change} ({data.changePercent}%)
      </td>
      <td>${(data.price * shares).toFixed(2)}</td>
    </tr>
  )
}

export default function Stocks() {
  return (
    <div>
      <h1>My Stock Holdings</h1>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Shares</th>
            <th>Price</th>
            <th>Change</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <StockRow key={h.symbol} symbol={h.symbol} shares={h.shares} />
          ))}
        </tbody>
      </table>
    </div>
  )
}