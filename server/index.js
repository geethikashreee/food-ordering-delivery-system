import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
})
const app = express()
app.use(cors(), express.json())

const q = (sql, params = []) => db.query(sql, params).then(([rows]) => rows)
const route = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }))

app.get('/api/kpis', route(async (_, res) => {
  const [row] = await q(`
    SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(CASE WHEN status <> 'CANCELLED' THEN total_amount END), 0) AS revenue,
           COALESCE(SUM(status IN ('PLACED','PREPARING','OUT_FOR_DELIVERY')), 0) AS active_orders,
           (SELECT ROUND(AVG(rating), 1) FROM reviews) AS avg_rating
    FROM orders`)
  res.json(row)
}))

app.get('/api/status-counts', route(async (_, res) =>
  res.json(await q('SELECT status, COUNT(*) AS count FROM orders GROUP BY status'))))

app.get('/api/revenue', route(async (_, res) =>
  res.json(await q(`SELECT DATE_FORMAT(day, '%d %b') AS label, orders, revenue
                    FROM vw_daily_revenue ORDER BY day`))))

app.get('/api/top-items', route(async (_, res) =>
  res.json(await q('SELECT * FROM vw_top_items LIMIT 5'))))

app.get('/api/payments', route(async (_, res) =>
  res.json(await q(`SELECT method, COUNT(*) AS txns,
                           SUM(status = 'SUCCESS') AS success, SUM(status = 'FAILED') AS failed
                    FROM payments GROUP BY method`))))

app.get('/api/delivery', route(async (_, res) =>
  res.json(await q('SELECT * FROM vw_delivery_perf ORDER BY avg_minutes'))))

app.get('/api/low-reviews', route(async (_, res) =>
  res.json(await q(`SELECT r.name AS restaurant, rv.rating, rv.comment
                    FROM reviews rv JOIN restaurants r ON r.restaurant_id = rv.restaurant_id
                    WHERE rv.rating <= 3 ORDER BY rv.created_at DESC LIMIT 5`))))

app.get('/api/orders', route(async (req, res) => {
  const { status, search = '' } = req.query
  const params = [`%${search}%`, `%${search}%`]
  let where = '(u.name LIKE ? OR r.name LIKE ?)'
  if (status) { where += ' AND o.status = ?'; params.push(status) }
  res.json(await q(`
    SELECT o.order_id, u.name AS customer, r.name AS restaurant, o.status, o.total_amount,
           DATE_FORMAT(o.order_time, '%d %b, %H:%i') AS placed
    FROM orders o JOIN users u ON u.user_id = o.user_id
                  JOIN restaurants r ON r.restaurant_id = o.restaurant_id
    WHERE ${where} ORDER BY o.order_time DESC LIMIT 100`, params))
}))

app.patch('/api/orders/:id/status', route(async (req, res) => {
  await db.query('CALL sp_update_order_status(?, ?)', [req.params.id, req.body.status])
  res.json({ ok: true })
}))

app.get('/api/restaurants', route(async (_, res) =>
  res.json(await q('SELECT * FROM vw_restaurant_stats ORDER BY revenue DESC'))))

app.post('/api/restaurants', route(async (req, res) => {
  const { name, cuisine, city } = req.body
  if (!name) return res.status(400).json({ error: 'Restaurant name is required' })
  await q('INSERT INTO restaurants(name, cuisine, city) VALUES (?, ?, ?)', [name, cuisine, city])
  res.json({ ok: true })
}))

app.patch('/api/restaurants/:id/toggle', route(async (req, res) => {
  await q('UPDATE restaurants SET is_open = NOT is_open WHERE restaurant_id = ?', [req.params.id])
  res.json({ ok: true })
}))

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    await q('DELETE FROM restaurants WHERE restaurant_id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    const msg = e.code === 'ER_ROW_IS_REFERENCED_2'
      ? 'This restaurant has menu items or orders, so it can’t be deleted. Mark it closed instead.'
      : e.message
    res.status(409).json({ error: msg })
  }
})

app.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000))
