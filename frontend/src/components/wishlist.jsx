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

  const [filterPeople, setFilterPeople] = useState([])
  const [filterTags, setFilterTags] = useState([])

  // state variable called items which holds the list of wishlist items
  const [items, setItems] = useState([])
  // tracks whether the "add item" form is visible or hidden
  const [showForm, setShowForm] = useState(false)
  // holds the values of the form inputs as the user types
  const [form, setForm] = useState({ 
    name: "", brand: "", price: "", image_url: "", link: "", notes: "",
    people: [],
    tags: []
  })
  // tracks which item is currently being edited
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const toggleFilterPerson = (person) => {
    setFilterPeople(f => f.includes(person) ? f.filter(p => p !== person) : [...f, person])
  }

  const toggleFilterTag = (tag) => {
    setFilterTags(f => f.includes(tag) ? f.filter(t => t !== tag) : [...f, tag])
  }

  // This stores the cards of information locally on device
  useEffect(() => {
    const stored = localStorage.getItem(`wishlist_${category}`)
    if (stored) setItems(JSON.parse(stored))
  }, [category])

  // saves items to localStorage
  const save = (newItems) => {
    setItems(newItems)
    localStorage.setItem(`wishlist_${category}`, JSON.stringify(newItems))
  }

  // toggles a person on/off in the add form
  const togglePerson = (person) => {
    setForm(f => ({
      ...f,
      people: f.people.includes(person)
        ? f.people.filter(p => p !== person)
        : [...f.people, person]
    }))
  }

  // toggles a tag on/off in the add form
  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag]
    }))
  }

  // toggles a person on/off in the edit form
  const toggleEditPerson = (person) => {
    setEditForm(f => ({
      ...f,
      people: f.people?.includes(person)
        ? f.people.filter(p => p !== person)
        : [...(f.people ?? []), person]
    }))
  }

  // toggles a tag on/off in the edit form
  const toggleEditTag = (tag) => {
    setEditForm(f => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...(f.tags ?? []), tag]
    }))
  }

  // adds a new item
  const handleAdd = () => {
    if (!form.name) return
    const newItem = { ...form, id: Date.now(), price: parseFloat(form.price) || 0 }
    save([newItem, ...items])
    setForm({ name: "", brand: "", price: "", image_url: "", link: "", notes: "", people: [], tags: [] })
    setShowForm(false)
  }

  // starts editing an item
  const handleEditStart = (item) => {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  // saves the edited item
  const handleEditSave = () => {
    const updated = items.map(i => i.id === editingId ? { ...editForm, price: parseFloat(editForm.price) || 0 } : i)
    save(updated)
    setEditingId(null)
    setEditForm({})
  }

  // cancels editing
  const handleEditCancel = () => {
    setEditingId(null)
    setEditForm({})
  }

  // deletes an item
  const handleDelete = (id) => {
    save(items.filter(i => i.id !== id))
  }

  const filteredItems = items.filter(item => {
    const peopleMatch = filterPeople.length === 0 || filterPeople.some(p => item.people?.includes(p))
    const tagsMatch = filterTags.length === 0 || filterTags.some(t => item.tags?.includes(t))
    return peopleMatch && tagsMatch
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button className={styles.addButton} onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Filter Bar */}
      {items.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>For:</span>
            {["Emma", "Victoria", "Me"].map(person => (
              <button
                key={person}
                onClick={() => toggleFilterPerson(person)}
                className={filterPeople.includes(person) ? styles.filterButtonActive : styles.filterButton}
              >
                {person}
              </button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tags:</span>
            {/* Edit this list to make new check boxes */}
            {["Men", "Women", "Vintage", "New", "Footwear", "Top", "Bottoms"].map(tag => (
              <button
                key={tag}
                onClick={() => toggleFilterTag(tag)}
                className={filterTags.includes(tag) ? styles.filterButtonActive : styles.filterButton}
              >
                {tag}
              </button>
            ))}
          </div>
          {(filterPeople.length > 0 || filterTags.length > 0) && (
            <button className={styles.clearButton} onClick={() => { setFilterPeople([]); setFilterTags([]) }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Add Item Form */}
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
            <div className={styles.formGroup}>
              <label className={styles.label}>For</label>
              <div className={styles.checkboxGroup}>
                {["Emma", "Victoria"].map(person => (
                  <label key={person} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={form.people.includes(person)} onChange={() => togglePerson(person)} className={styles.checkbox} />
                    {person}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tags</label>
              <div className={styles.checkboxGroup}>
                {["Men", "Women", "Vintage", "New"].map(tag => (
                  <label key={tag} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={form.tags.includes(tag)} onChange={() => toggleTag(tag)} className={styles.checkbox} />
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

      {/* Card Grid */}
      <div className={styles.grid}>
        {filteredItems.map(item => (
          <div key={item.id} className={styles.card}>

            {/* Edit Mode */}
            {editingId === item.id ? (
              <div className={styles.editForm}>
                <h3 className={styles.formTitle}>Edit Item</h3>
                <div className={styles.editGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Name *</label>
                    <input className={styles.input} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Brand</label>
                    <input className={styles.input} value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Price</label>
                    <input className={styles.input} type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Image URL</label>
                    <input className={styles.input} value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Link to Buy</label>
                    <input className={styles.input} value={editForm.link} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes</label>
                    <input className={styles.input} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>For</label>
                    <div className={styles.checkboxGroup}>
                      {["Emma", "Victoria", "Me"].map(person => (
                        <label key={person} className={styles.checkboxLabel}>
                          <input type="checkbox" checked={editForm.people?.includes(person) ?? false} onChange={() => toggleEditPerson(person)} className={styles.checkbox} />
                          {person}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tags</label>
                    <div className={styles.checkboxGroup}>
                      {["Men", "Women", "Vintage", "New", "Footwear", "Top", "Bottoms"].map(tag => (
                        <label key={tag} className={styles.checkboxLabel}>
                          <input type="checkbox" checked={editForm.tags?.includes(tag) ?? false} onChange={() => toggleEditTag(tag)} className={styles.checkbox} />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button className={styles.submitButton} onClick={handleEditSave}>Save</button>
                  <button className={styles.cancelButton} onClick={handleEditCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
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
                  <div className={styles.cardFooter}>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className={styles.buyLink}>
                        View Item →
                      </a>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button className={styles.editButton} onClick={() => handleEditStart(item)}>Edit</button>
                      <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}