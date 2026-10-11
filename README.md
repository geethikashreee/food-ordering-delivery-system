# Kitchen Control: Food Delivery Admin Dashboard

React + Node/Express + MySQL.

## Setup
1. Database: `mysql -u root -p < database/schema.sql` (creates `food_delivery` with sample data; re-run to reset)
2. Server: `cd server && cp .env.example .env` (add your MySQL password), then `npm install && npm start`
3. Client: `cd client && npm install && npm run dev` and open http://localhost:5173

## Where the DBMS concepts live
| Concept | Where |
|---|---|
| Views | `vw_daily_revenue`, `vw_restaurant_stats`, `vw_top_items`, `vw_delivery_perf` |
| Trigger | `trg_review_rating` (updates restaurant rating), `trg_order_status_log` (audit log) |
| Stored procedure + transaction | `sp_update_order_status` (called by the Orders page) |
| Indexes | `idx_orders_time/status/restaurant`; try `EXPLAIN` with and without |
| Referential integrity | Deleting a restaurant that has orders fails with a 409 |
