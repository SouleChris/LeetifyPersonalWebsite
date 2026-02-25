import { useState, useEffect } from "react"
import styles from "../styles/wishlist.module.css"

export default function WishlistPage({ category, title }) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", brand: "", price: "", image_url: "", link: "", notes: "" })

  useEffect(() => {
    const stored = localStorage.getItem(`wishlist_${category}`)
    if (stored) setItems(JSON.parse(stored))
  }, [category])

  const save = (newItems) => {
    setItems(newItems)
    localStorage.setItem(`wishlist_${category}`, JSON.stringify(newItems))
  }

  const handleAdd = () => {
    if (!form.name) return
    const newItem = { ...form, id: Date.now(), price: parseFloat(form.price) || 0 }
    save([newItem, ...items])
    setForm({ name: "", brand: "", price: "", image_url: "", link: "", notes: "" })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    save(items.filter(i => i.id !== id))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button className={styles.addButton} onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <h2 className={styles.formTitle}>Add New Item</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name *</label>
              <input className={styles.input} placeholder="e.g. Relaxed Chino" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Brand</label>
              <input className={styles.input} placeholder="e.g. Ralph Lauren" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price</label>
              <input className={styles.input} placeholder="e.g. 89.99" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Image URL</label>
              <input className={styles.input} placeholder="https://..." value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Link to Buy</label>
              <input className={styles.input} placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Notes</label>
              <input className={styles.input} placeholder="e.g. Size M, navy color" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <button className={styles.submitButton} onClick={handleAdd}>Add to Wishlist</button>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>No items yet. Click "+ Add Item" to get started.</p>
        </div>
      )}

      <div className={styles.grid}>
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            {item.image_url && (
              <div className={styles.imageWrapper}>
                <img src={item.image_url} alt={item.name} className={styles.image} />
              </div>
            )}
            {!item.image_url && (
              <div className={styles.imagePlaceholder}>No Image</div>
            )}
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <div>
                  {item.brand && <p className={styles.brand}>{item.brand}</p>}
                  <p className={styles.name}>{item.name}</p>
                </div>
                {item.price > 0 && <p className={styles.price}>${item.price.toFixed(2)}</p>}
              </div>
              {item.notes && <p className={styles.notes}>{item.notes}</p>}
              <div className={styles.cardFooter}>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className={styles.buyLink}>
                    View Item →
                  </a>
                )}
                <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}