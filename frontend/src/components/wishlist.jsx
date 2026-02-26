/*
Author: Christopher Soule
Date: 02/26/2026
Component used in Watches and Clothing Pages
This allows for users to create wishlists of products they might want to purchase
Gives photo of item, name, url to item, url to photo, price, and short notes
*/
import { useState, useEffect } from "react"
import styles from "../styles/wishlist.module.css"

// 
export default function WishlistPage({ category, title }) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", brand: "", price: "", image_url: "", link: "", notes: "" })

  // This stores the cards of information locally on device
  // localStorage can be changed to use SupaBase
  useEffect(() => {
    const stored = localStorage.getItem(`wishlist_${category}`)
    if (stored) setItems(JSON.parse(stored))
  }, [category])

  // this puts a new item into the JSON file
  const save = (newItems) => {
    setItems(newItems)
    localStorage.setItem(`wishlist_${category}`, JSON.stringify(newItems))
  }

  // Helper method to add new items to the database
  const handleAdd = () => {
    if (!form.name) return
    const newItem = { ...form, id: Date.now(), price: parseFloat(form.price) || 0 }
    save([newItem, ...items])
    setForm({ name: "", brand: "", price: "", image_url: "", link: "", notes: "" })
    setShowForm(false)
  }

  // this deletes items from the list
  const handleDelete = (id) => {
    save(items.filter(i => i.id !== id))
  }

  // Top of the HTML essentially
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>

        {/* Button that opens the form input */}
        {/* Want to maybe style the button differenttly */}
        <button className={styles.addButton} onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Top of the input form */}
      {/* Each part of the form has a different classname for styling */}
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

      {/* Contoainer that holds all item card */}
      <div className={styles.grid}>
        {/* Loops through each item in the items array and render a card */}
        {/* Individual card container, key helps React track each item uniquely */}
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            {/* Only render the image block if the item has an image_url */}
            {item.image_url && (
              <div className={styles.imageWrapper}>
                {/* Display the item image, using item.name as accessible alt text */}
                <img src={item.image_url} alt={item.name} className={styles.image} />
              </div>
            )}
            {/* If there is NO image_url, show a placeholder block instead */}
            {!item.image_url && (
              <div className={styles.imagePlaceholder}>No Image</div>
            )}
            {/* Card body holds all the text content and actions */}
            <div className={styles.cardBody}>
              {/* Top section of the card: brand/name on the left, price on the right */}
              <div className={styles.cardTop}>
                <div>
                  {/* Only show the brand name if the item has one */}
                  {item.brand && <p className={styles.brand}>{item.brand}</p>}
                  {/* Always show the item name */}
                  <p className={styles.name}>{item.name}</p>
                </div>
                {/* Only show the price if it's greater than 0, formatted to 2 decimal places */}
                {item.price > 0 && <p className={styles.price}>${item.price.toFixed(2)}</p>}
              </div>
              {/* Only show the notes paragraph if the item has notes */}
              {item.notes && <p className={styles.notes}>{item.notes}</p>}
              {/* Footer holds the external link and delete button */}
              <div className={styles.cardFooter}>
                {/* Only render the link if the item has one, opens in a new tab safely */}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className={styles.buyLink}>
                    View Item →
                  </a>
                )}
                {/* Delete button — calls handleDelete with this item's id when clicked */}
                <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}