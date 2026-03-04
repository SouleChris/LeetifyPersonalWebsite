/*
Author: Christopher Soule
Date: 02/26/2026
Component used in Watches and Clothing Pages
This allows for users to create wishlists of products they might want to purchase
Gives photo of item, name, url to item, url to photo, price, and short notes
*/
import { useState, useEffect } from "react"
import styles from "../styles/wishlist.module.css"

// defines component and expects two props to be passed in when it's used, category and title
export default function WishlistPage({ category, title }) {
  // state variable called items which holds the list of wishlist items. It starts as an empty array. setItems is the function you call to update it.
  const [items, setItems] = useState([])
  // tracks whether the "add item" form is visible or hidden. Starts as false (hidden). You'd toggle this to true to show the form.
  const [showForm, setShowForm] = useState(false)
  // holds the values of the form inputs as the user types. Each key corresponds to a field in the form, and they all start as empty strings
  const [form, setForm] = useState({ 
    name: "", brand: "", price: "", image_url: "", link: "", notes: "",
    people: [],
    tags: []
  })

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

  // toggles a person on/off in the form
  const togglePerson = (person) => {
    setForm(f => ({
      ...f,
      people: f.people.includes(person)
        ? f.people.filter(p => p !== person)
        : [...f.people, person]
    }))
  }

  // toggles a tag on/off in the form
  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag]
    }))
  }

  // Helper method to add new items to the database
  const handleAdd = () => {
    if (!form.name) return
    const newItem = { ...form, id: Date.now(), price: parseFloat(form.price) || 0 }
    save([newItem, ...items])
    setForm({ name: "", brand: "", price: "", image_url: "", link: "", notes: "", people: [], tags: [] })
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
        <button className={styles.addButton} onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Top of the input form */}
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

            {/* People checkboxes */}
            <div className={styles.formGroup}>
              <label className={styles.label}>For</label>
              <div className={styles.checkboxGroup}>
                {["Emma", "Victoria"].map(person => (
                  <label key={person} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.people.includes(person)}
                      onChange={() => togglePerson(person)}
                      className={styles.checkbox}
                    />
                    {person}
                  </label>
                ))}
              </div>
            </div>

            {/* Tag checkboxes */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Tags</label>
              <div className={styles.checkboxGroup}>
                {["Men", "Women", "Vintage", "New"].map(tag => (
                  <label key={tag} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className={styles.checkbox}
                    />
                    {tag}
                  </label>
                ))}
              </div>
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

      {/* Container that holds all item cards */}
      <div className={styles.grid}>
        {/* Loops through each item in the items array and renders a card */}
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            {/* Only render the image block if the item has an image_url */}
            {item.image_url && (
              <div className={styles.imageWrapper}>
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
                  {item.brand && <p className={styles.brand}>{item.brand}</p>}
                  <p className={styles.name}>{item.name}</p>
                </div>
                {item.price > 0 && <p className={styles.price}>${item.price.toFixed(2)}</p>}
              </div>
              {/* Only show notes if the item has them */}
              {item.notes && <p className={styles.notes}>{item.notes}</p>}
              {/* Show people and tag badges if any are set */}
              {(item.people?.length > 0 || item.tags?.length > 0) && (
                <div className={styles.tagRow}>
                  {item.people?.map(p => (
                    <span key={p} className={styles.personTag}>{p}</span>
                  ))}
                  {item.tags?.map(t => (
                    <span key={t} className={styles.tag}>{t}</span>
                  ))}
                </div>
              )}
              {/* Footer holds the external link and delete button */}
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