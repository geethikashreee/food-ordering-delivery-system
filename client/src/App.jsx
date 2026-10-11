
import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, CartesianGrid
} from 'recharts'

const api = async (url, opts) => {
  const res = await fetch('/api' + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const STATUSES = ['PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
const COLORS = {
  PLACED: '#7b8d93',
  PREPARING: '#e7a21b',
  OUT_FOR_DELIVERY: '#2b7a9b',
  DELIVERED: '#1e6b52',
  CANCELLED: '#c8402b'
}
const money = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
const nice = s => String(s || '').replace(/_/g, ' ').toLowerCase()

const foodImages = {
  biryani: 'photo-1563379091339-03246963d96c',
  pizza: 'photo- pizza',
  burger: 'photo-1568901346375-23c9450c58cd',
  dosa: 'photo-1589301760014-d929f3979dbc',
  cake: 'photo-1578985545062-69928b1d9587',
  chicken: 'photo-1626645738196-c2a7c87a8f58',
  pasta: 'photo-1473093295043-cdd812d0e601',
  default: 'photo-1546069901-ba9599a7e63c'
}

const photo = (id, width = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

const categories = [
  { name: 'All', emoji: '🍽️' },
  { name: 'Biryani', emoji: '🍛' },
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Burgers', emoji: '🍔' },
  { name: 'South Indian', emoji: '🥞' },
  { name: 'Desserts', emoji: '🍰' },
  { name: 'Healthy', emoji: '🥗' }
]

const dishes = [
  { id: 1, name: 'Classic Chicken Biryani', restaurant: 'Spice Route', category: 'Biryani', price: 249, rating: 4.7, image: 'photo-1563379091339-03246963d96c', veg: false },
  { id: 2, name: 'Margherita Pizza', restaurant: 'Oven Stories', category: 'Pizza', price: 199, rating: 4.5, image: 'photo-1579751626657-72bc17010498', veg: true },
  { id: 3, name: 'Double Cheese Burger', restaurant: 'Burger District', category: 'Burgers', price: 179, rating: 4.6, image: 'photo-1568901346375-23c9450c58cd', veg: false },
  { id: 4, name: 'Crispy Masala Dosa', restaurant: 'Madras Tiffin', category: 'South Indian', price: 99, rating: 4.8, image: 'photo-1589301760014-d929f3979dbc', veg: true },
  { id: 5, name: 'Chocolate Cake', restaurant: 'Sugar Cloud', category: 'Desserts', price: 149, rating: 4.6, image: 'photo-1578985545062-69928b1d9587', veg: true },
  { id: 6, name: 'Creamy White Sauce Pasta', restaurant: 'Pasta House', category: 'Pizza', price: 229, rating: 4.4, image: 'photo-1473093295043-cdd812d0e601', veg: true },
  { id: 7, name: 'Grilled Chicken', restaurant: 'Fire & Spice', category: 'Biryani', price: 279, rating: 4.5, image: 'photo-1626645738196-c2a7c87a8f58', veg: false },
  { id: 8, name: 'Fresh Garden Bowl', restaurant: 'Green Fork', category: 'Healthy', price: 159, rating: 4.3, image: 'photo-1512621776951-a57141f2eefd', veg: true }
]

function Pill({ status }) {
  return <span className="pill" style={{ '--c': COLORS[status] || '#66797f' }}>{nice(status)}</span>
}

function Overview() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      'kpis', 'status-counts', 'revenue', 'top-items',
      'payments', 'delivery', 'low-reviews'
    ].map(p => api('/' + p)))
      .then(([kpis, status, revenue, items, payments, delivery, reviews]) =>
        setD({ kpis, status, revenue, items, payments, delivery, reviews }))
      .catch(e => setErr(e.message))
  }, [])

  if (err) return <p className="notice">Could not load dashboard: {err}</p>
  if (!d) return <p className="muted">Loading analytics…</p>

  const total = d.status.reduce((s, x) => s + Number(x.count), 0)
  const byStatus = Object.fromEntries(d.status.map(x => [x.status, Number(x.count)]))
  const revenue = d.revenue.map(r => ({ ...r, revenue: Number(r.revenue) }))

  return <>
    <div className="kpis">
      <div><span>Total revenue</span><b>{money(d.kpis.revenue)}</b></div>
      <div><span>Total orders</span><b>{d.kpis.total_orders}</b></div>
      <div><span>Active orders</span><b>{d.kpis.active_orders}</b></div>
      <div><span>Average rating</span><b>{d.kpis.avg_rating ?? '–'}</b></div>
    </div>

    <section className="card">
      <h2>Order pipeline</h2>
      <div className="bar">
        {STATUSES.map(s => byStatus[s] ? <i key={s} style={{ flex: byStatus[s], background: COLORS[s] }} /> : null)}
      </div>
      <ul className="legend">
        {STATUSES.map(s => <li key={s}>
          <em style={{ background: COLORS[s] }} />{nice(s)} <b>{byStatus[s] || 0}</b>
          <small>{total ? Math.round(((byStatus[s] || 0) / total) * 100) : 0}%</small>
        </li>)}
      </ul>
    </section>

    <div className="grid2">
      <section className="card">
        <h2>Revenue · Last 30 days</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenue}>
            <CartesianGrid stroke="#e3e9e6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₹' + v / 1000 + 'k'} width={48} />
            <Tooltip formatter={v => money(v)} />
            <Area dataKey="revenue" stroke="#fc8019" fill="#fc8019" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      <section className="card">
        <h2>Best-selling dishes</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={d.items.map(i => ({ ...i, units: Number(i.units) }))} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="item" tick={{ fontSize: 12 }} width={110} />
            <Tooltip />
            <Bar dataKey="units" fill="#fc8019" radius={[0, 5, 5, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>

    <div className="grid3">
      <section className="card">
        <h2>Payments</h2>
        <table><thead><tr><th>Method</th><th>Transactions</th><th>Failed</th></tr></thead>
          <tbody>{d.payments.map(p => <tr key={p.method}><td>{p.method}</td><td>{p.txns}</td><td>{p.failed}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="card">
        <h2>Delivery partners</h2>
        <table><thead><tr><th>Partner</th><th>Trips</th><th>Avg min</th></tr></thead>
          <tbody>{d.delivery.map(p => <tr key={p.partner}><td>{p.partner}</td><td>{p.deliveries}</td><td>{p.avg_minutes}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="card">
        <h2>Recent low ratings</h2>
        {d.reviews.length === 0 ? <p className="muted">No low ratings yet.</p> :
          <ul className="reviews">{d.reviews.map((r, i) => <li key={i}><b>{r.rating}★</b> {r.restaurant}<br /><small>{r.comment}</small></li>)}</ul>}
      </section>
    </div>
  </>
}

function Orders() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    api(`/orders?status=${status}&search=${encodeURIComponent(search)}`)
      .then(setRows).catch(e => setErr(e.message))
  }, [status, search])

  useEffect(load, [load])

  const change = async (id, s) => {
    try {
      await api(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) })
      setErr('')
      load()
    } catch (e) { setErr(e.message) }
  }

  return <section className="card">
    <div className="toolbar">
      <input placeholder="Search customer or restaurant" value={search} onChange={e => setSearch(e.target.value)} />
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{nice(s)}</option>)}
      </select>
    </div>
    {err && <p className="notice">{err}</p>}
    <div className="scroll"><table>
      <thead><tr><th>Order</th><th>Customer</th><th>Restaurant</th><th>Placed</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>{rows.map(o => <tr key={o.order_id}>
        <td>#{o.order_id}</td><td>{o.customer}</td><td>{o.restaurant}</td><td>{o.placed}</td>
        <td>{money(o.total_amount)}</td><td><Pill status={o.status} /></td>
        <td><select value={o.status} onChange={e => change(o.order_id, e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{nice(s)}</option>)}
        </select></td>
      </tr>)}</tbody>
    </table>
    {rows.length === 0 && <p className="muted">No orders match these filters.</p>}</div>
  </section>
}

function Restaurants() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', cuisine: '', city: '' })
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    api('/restaurants').then(setRows).catch(e => setErr(e.message))
  }, [])

  useEffect(load, [load])

  const run = async (url, opts) => {
    try { await api(url, opts); setErr(''); load() }
    catch (e) { setErr(e.message) }
  }

  const add = async e => {
    e.preventDefault()
    await run('/restaurants', { method: 'POST', body: JSON.stringify(form) })
    setForm({ name: '', cuisine: '', city: '' })
  }

  return <section className="card">
    <form className="toolbar" onSubmit={add}>
      <input required placeholder="Restaurant name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input required placeholder="Cuisine" value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} />
      <input required placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
      <button className="primary">Add restaurant</button>
    </form>
    {err && <p className="notice">{err}</p>}
    <div className="scroll"><table>
      <thead><tr><th>Name</th><th>Cuisine</th><th>Orders</th><th>Revenue</th><th>Rating</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.restaurant_id}>
        <td>{r.name}<br /><small>{r.city}</small></td><td>{r.cuisine}</td><td>{r.orders}</td>
        <td>{money(r.revenue)}</td><td>{Number(r.avg_rating) || '–'}</td>
        <td><button className="ghost" onClick={() => run(`/restaurants/${r.restaurant_id}/toggle`, { method: 'PATCH' })}>{r.is_open ? 'Open' : 'Closed'}</button></td>
        <td><button className="danger" onClick={() => run(`/restaurants/${r.restaurant_id}`, { method: 'DELETE' })}>Delete</button></td>
      </tr>)}</tbody>
    </table></div>
  </section>
}

function FoodCard({ item, add }) {
  return <article className="food-card">
    <div className="food-image">
      <img src={photo(item.image, 600)} alt={item.name} loading="lazy" />
      <span className="food-rating">★ {item.rating}</span>
    </div>
    <div className="food-info">
      <span className="food-restaurant">{item.restaurant}</span>
      <h3>{item.name}</h3>
      <div className="food-bottom">
        <b>{money(item.price)}</b>
        <button className="add-btn" onClick={() => add(item)}>ADD +</button>
      </div>
    </div>
  </article>
}

function CustomerSite({ onAdmin }) {
  const [restaurants, setRestaurants] = useState([])
  const [restaurantError, setRestaurantError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [page, setPage] = useState('Home')
  const [auth, setAuth] = useState('Login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [notice, setNotice] = useState('')
  const [lastOrder, setLastOrder] = useState(null)

  useEffect(() => {
    api('/restaurants')
      .then(setRestaurants)
      .catch(e => setRestaurantError(e.message))
  }, [])

  const add = item => {
    setCart(old => {
      const found = old.find(x => x.id === item.id)
      return found
        ? old.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
        : [...old, { ...item, qty: 1 }]
    })
    setNotice(`${item.name} added to your cart`)
    setTimeout(() => setNotice(''), 2200)
  }

  const changeQty = (id, delta) => {
    setCart(old => old
      .map(x => x.id === id ? { ...x, qty: x.qty + delta } : x)
      .filter(x => x.qty > 0))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const filtered = dishes.filter(item =>
    (category === 'All' || item.category === category) &&
    `${item.name} ${item.restaurant} ${item.category}`.toLowerCase().includes(query.toLowerCase())
  )

  const restaurantImage = (r, i) => {
    const c = `${r.cuisine || ''} ${r.name || ''}`.toLowerCase()
    if (c.includes('pizza')) return photo('photo-1579751626657-72bc17010498', 600)
    if (c.includes('burger')) return photo('photo-1568901346375-23c9450c58cd', 600)
    if (c.includes('south') || c.includes('dosa')) return photo('photo-1589301760014-d929f3979dbc', 600)
    if (c.includes('biryani') || c.includes('indian')) return photo('photo-1563379091339-03246963d96c', 600)
    return photo([
      'photo-1513104890138-7c749659a591',
      'photo-1546069901-ba9599a7e63c',
      'photo-1565299624946-b28f40a0ae38',
      'photo-1555939594-58d7cb561ad1'
    ][i % 4], 600)
  }

  const checkout = () => {
    if (!cart.length) return
    if (!signedIn) {
      setPage('Account')
      setNotice('Sign in to continue to checkout')
      return
    }
    setLastOrder({ id: Date.now().toString().slice(-6), total: subtotal, items: cart, status: 'PLACED' })
    setCart([])
    setPage('Tracking')
    setNotice('Demo order created! Backend checkout is not connected yet.')
  }

  const login = e => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setNotice('Enter your email and password.')
      return
    }
    // Demo-only account state. No credentials are sent to the server.
    setSignedIn(true)
    setCustomerName(email.split('@')[0])
    setPage('Home')
    setNotice('Demo sign-in successful. Real authentication is not connected yet.')
  }

  const go = next => {
    setPage(next)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="customer-site">
    <div className="announcement">GOOD FOOD. GREAT MOOD. <span>Delivered to your door ✨</span></div>
    <header className="customer-header">
      <button className="brand" onClick={() => go('Home')}><span className="brand-mark">f.</span><span>food<span className="brand-orange">ly</span><small>GOOD FOOD, GOOD DAYS</small></span></button>
      <div className="delivery-location"><span>⌖</span><div><small>DELIVERING TO</small><b>Your neighbourhood</b></div></div>
      <div className="customer-search"><span>⌕</span><input value={query} onChange={e => { setQuery(e.target.value); setPage('Home') }} placeholder="Search dishes, restaurants..." /></div>
      <div className="header-actions">
        <button onClick={() => go('Tracking')}>Track order</button>
        <button onClick={() => go('Account')}>{signedIn ? `Hi, ${customerName}` : 'Sign in'}</button>
        <button className="cart-top" onClick={() => go('Cart')}>🛒 <span>Cart</span> <b>{cart.reduce((s, x) => s + x.qty, 0)}</b></button>
      </div>
    </header>

    <nav className="customer-nav">
      {['Home', 'Restaurants', 'Cart', 'Tracking'].map(item =>
        <button key={item} className={page === item ? 'active' : ''} onClick={() => go(item)}>{item}</button>
      )}
      <button className="admin-link" onClick={onAdmin}>⚙ Admin dashboard</button>
    </nav>

    {notice && <div className="toast">{notice}<button onClick={() => setNotice('')}>×</button></div>}

    {page === 'Home' && <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">YOUR NEXT FAVOURITE MEAL IS HERE</span>
          <h1>Cravings?<br />We've got <span>you.</span></h1>
          <p>From comfort-food classics to your new obsession. Deliciousness is just a few clicks away.</p>
          <button className="hero-button" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Explore food <span>↗</span></button>
          <div className="hero-trust"><span>★ 4.8/5</span><span>•</span><span>Loved by foodies everywhere</span></div>
        </div>
        <div className="hero-visual">
          <img src={photo('photo-1546069901-ba9599a7e63c', 1000)} alt="A delicious fresh meal" />
          <div className="hero-floating"><span>🍴</span><div><b>Made for your cravings</b><small>Fresh picks, every day</small></div></div>
          <div className="hero-sticker">TASTY<br />& FRESH</div>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading"><div><span className="eyebrow">WHAT ARE YOU CRAVING?</span><h2>Find your flavour</h2></div><span className="section-note">A little something for every mood.</span></div>
        <div className="category-list">
          {categories.map(c => <button key={c.name} onClick={() => { setCategory(c.name); document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' }) }} className={`category-chip ${category === c.name ? 'selected' : ''}`}><span>{c.emoji}</span>{c.name}</button>)}
        </div>
      </section>

      <section className="menu-section" id="menu-section">
        <div className="section-heading"><div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>Popular right now <span>✳</span></h2></div><span className="section-note">{filtered.length} delicious picks</span></div>
        <div className="food-grid">
          {filtered.map(item => <FoodCard key={item.id} item={item} add={add} />)}
          {filtered.length === 0 && <p className="muted">No dishes found. Try another search.</p>}
        </div>
      </section>

      <section className="restaurant-section">
        <div className="section-heading"><div><span className="eyebrow">THE NEIGHBOURHOOD FAVOURITES</span><h2>Restaurants to love</h2></div><button className="text-link" onClick={() => go('Restaurants')}>View all ↗</button></div>
        {restaurantError && <p className="muted">Restaurant data could not load: {restaurantError}</p>}
        <div className="restaurant-grid">
          {restaurants.filter(r => r.is_open !== 0 && r.is_open !== false).slice(0, 8).map((r, i) =>
            <article className="restaurant-card" key={r.restaurant_id}>
              <div className="restaurant-photo"><img src={restaurantImage(r, i)} alt={r.name} loading="lazy" /><span className="restaurant-offer">POPULAR PICK</span></div>
              <div className="restaurant-info"><div><h3>{r.name}</h3><span className="rating">★ {Number(r.avg_rating) || 'New'}</span></div><p>{r.cuisine || 'Multi-cuisine'} · {r.city || 'Nearby'}</p><div className="restaurant-meta"><span>◷ 25–35 min</span><span>Freshly prepared</span></div></div>
            </article>
          )}
          {restaurants.length === 0 && !restaurantError && <p className="muted">Loading restaurants…</p>}
        </div>
      </section>
    </>}

    {page === 'Restaurants' && <section className="page-content">
      <span className="eyebrow">GOOD PLACES, GREAT PLATES</span><h1>Explore restaurants</h1>
      <p className="muted">Discover local favourites from your restaurant database.</p>
      <div className="restaurant-grid full-grid">
        {restaurants.filter(r => `${r.name} ${r.cuisine} ${r.city}`.toLowerCase().includes(query.toLowerCase())).map((r, i) =>
          <article className="restaurant-card" key={r.restaurant_id}>
            <div className="restaurant-photo"><img src={restaurantImage(r, i)} alt={r.name} loading="lazy" /></div>
            <div className="restaurant-info"><div><h3>{r.name}</h3><span className="rating">★ {Number(r.avg_rating) || 'New'}</span></div><p>{r.cuisine} · {r.city}</p><div className="restaurant-meta"><span>{r.is_open ? '● Open' : '● Closed'}</span><span>◷ 25–35 min</span></div></div>
          </article>
        )}
      </div>
    </section>}

    {page === 'Cart' && <section className="page-content">
      <span className="eyebrow">YOUR DELICIOUS PICKS</span><h1>Your cart 🛒</h1>
      <div className="cart-layout">
        <section className="card cart-items">
          {cart.length === 0 ? <div className="empty-state"><span>🥡</span><h2>Your cart is taking a little break</h2><p>Add something delicious and it'll show up here.</p><button className="hero-button" onClick={() => go('Home')}>Explore food ↗</button></div> :
            cart.map(item => <div className="cart-item" key={item.id}><img src={photo(item.image, 200)} alt={item.name} /><div className="cart-item-copy"><h3>{item.name}</h3><small>{item.restaurant}</small><b>{money(item.price * item.qty)}</b></div><div className="qty-control"><button onClick={() => changeQty(item.id, -1)}>−</button><b>{item.qty}</b><button onClick={() => changeQty(item.id, 1)}>+</button></div></div>)}
        </section>
        {cart.length > 0 && <section className="card bill-card"><h2>Bill details</h2><div><span>Item total</span><b>{money(subtotal)}</b></div><div><span>Delivery fee</span><b>{money(30)}</b></div><div><span>Platform fee</span><b>{money(5)}</b></div><hr /><div className="bill-total"><span>To pay</span><b>{money(subtotal + 35)}</b></div><button className="hero-button checkout-button" onClick={checkout}>Continue to checkout ↗</button><small>Demo checkout · No payment will be charged</small></section>}
      </div>
    </section>}

    {page === 'Account' && <section className="account-layout">
      <div className="account-art"><span className="eyebrow">A SEAT AT OUR TABLE</span><h1>Good food is<br />better shared.</h1><p>Sign in to keep your favourite flavours close.</p><img src={photo('photo-1512621776951-a57141f2eefd', 800)} alt="Fresh colourful food" /></div>
      <form className="account-form" onSubmit={login}>
        <span className="eyebrow">WELCOME TO FOODLY</span><h2>{auth === 'Login' ? 'Welcome back!' : 'Create your account'}</h2><p className="muted">This is a frontend demo account for now.</p>
        {auth === 'Signup' && <label>Your name<input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={4} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a password" /></label>
        <button className="hero-button checkout-button">{auth === 'Login' ? 'Sign in' : 'Create account'} ↗</button>
        <p className="auth-switch">{auth === 'Login' ? 'New to Foodly?' : 'Already have an account?'} <button type="button" onClick={() => setAuth(auth === 'Login' ? 'Signup' : 'Login')}>{auth === 'Login' ? 'Create account' : 'Sign in'}</button></p>
      </form>
    </section>}

    {page === 'Tracking' && <section className="page-content tracking-page">
      <span className="eyebrow">FROM OUR KITCHEN TO YOU</span><h1>Order tracking</h1>
      {lastOrder ? <div className="card tracking-card"><div className="tracking-top"><div><small>DEMO ORDER</small><h2>Order #{lastOrder.id}</h2></div><span className="tracking-status">● {nice(lastOrder.status)}</span></div><p>Your order total: <b>{money(lastOrder.total + 35)}</b></p><div className="tracking-steps">{['PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((s, i) => <div className={`tracking-step ${i === 0 ? 'done' : ''}`} key={s}><span>{i === 0 ? '✓' : i + 1}</span><b>{nice(s)}</b></div>)}</div><p className="muted">This is a sample tracking timeline; live delivery updates are not connected yet.</p></div> :
        <div className="empty-state card"><span>🛵</span><h2>No recent orders yet</h2><p>Your next delicious meal is waiting.</p><button className="hero-button" onClick={() => go('Home')}>Find your next meal ↗</button></div>}
    </section>}

    <footer className="customer-footer"><div className="footer-brand"><span className="brand-mark">f.</span><div><b>foodly</b><small>GOOD FOOD, GOOD DAYS</small></div></div><p>Made for food lovers. Served with a little extra joy. ♡</p><button onClick={onAdmin}>Admin portal ↗</button><small>College project demo · Food images are illustrative</small></footer>
  </div>
}

const TABS = { Overview, Orders, Restaurants }

function AdminSite({ onBack }) {
  const [tab, setTab] = useState('Overview')
  const View = TABS[tab]

  return <div className="shell">
    <nav className="admin-sidebar">
      <h1>foodly<span> / ADMIN</span></h1>
      <p className="admin-caption">RESTAURANT MANAGEMENT</p>
      {Object.keys(TABS).map(t => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t === 'Overview' ? '▦' : t === 'Orders' ? '▤' : '♧'} &nbsp; {t}</button>)}
      <button className="back-to-store" onClick={onBack}>↗ View storefront</button>
    </nav>
    <main className="admin-main"><div className="admin-topline"><span>FOODLY MANAGEMENT</span><span>ADMIN WORKSPACE</span></div><h2 className="page">{tab}</h2><View /></main>
  </div>
}

export default function App() {
  const [mode, setMode] = useState('store')
  return mode === 'store'
    ? <CustomerSite onAdmin={() => { setMode('admin'); window.scrollTo(0, 0) }} />
    : <AdminSite onBack={() => { setMode('store'); window.scrollTo(0, 0) }} />
}
