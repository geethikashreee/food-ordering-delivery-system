-- Open this file in MySQL Workbench and execute all statements.
-- Requires the existing Foodly tables in food_db and MySQL 8.0.
USE food_db;

-- One row per order, joined to the account that placed it.
-- These views read existing order records and contain no example orders.
CREATE OR REPLACE SQL SECURITY INVOKER VIEW foodly_order_history AS
SELECT
  o.id AS order_id,
  o.user_id AS customer_id,
  COALESCE(NULLIF(p.name, ''), u.name, 'Unknown customer') AS customer_name,
  u.email AS customer_email,
  o.restaurant_id,
  o.restaurant_name,
  o.created_at AS placed_at_epoch_ms,
  TIMESTAMPADD(MICROSECOND, MOD(o.created_at, 1000) * 1000, TIMESTAMPADD(SECOND, o.created_at DIV 1000, CAST('1970-01-01 00:00:00' AS DATETIME(3)))) AS placed_at_utc,
  TIMESTAMPADD(MINUTE, 330, TIMESTAMPADD(MICROSECOND, MOD(o.created_at, 1000) * 1000, TIMESTAMPADD(SECOND, o.created_at DIV 1000, CAST('1970-01-01 00:00:00' AS DATETIME(3))))) AS placed_at_ist,
  TIMESTAMPADD(MINUTE, 330, TIMESTAMPADD(MICROSECOND, MOD(o.updated_at, 1000) * 1000, TIMESTAMPADD(SECOND, o.updated_at DIV 1000, CAST('1970-01-01 00:00:00' AS DATETIME(3))))) AS updated_at_ist,
  o.status AS order_status,
  o.schedule AS delivery_schedule,
  o.payment AS payment_method,
  o.subtotal AS subtotal_inr,
  o.discount AS discount_inr,
  o.delivery AS delivery_fee_inr,
  o.tax AS tax_inr,
  o.total AS total_inr,
  o.coupon,
  JSON_LENGTH(o.items) AS distinct_dishes,
  o.items AS items_json,
  o.address AS delivery_address,
  o.phone AS delivery_phone,
  o.note AS delivery_instructions,
  o.preparation_minutes,
  o.queue_minutes,
  o.rescue_deal_id,
  o.squad_id
FROM orders AS o
LEFT JOIN users AS u ON u.id = o.user_id
LEFT JOIN profiles AS p ON p.user_id = o.user_id;

-- One row per ordered dish, with quantity and the price charged at checkout.
CREATE OR REPLACE SQL SECURITY INVOKER VIEW foodly_order_items AS
SELECT
  h.order_id,
  h.customer_id,
  h.customer_name,
  h.customer_email,
  h.restaurant_name,
  h.placed_at_epoch_ms,
  h.placed_at_ist,
  h.order_status,
  item.dish_id,
  item.dish_name,
  item.quantity,
  item.unit_price_inr,
  item.quantity * item.unit_price_inr AS line_total_inr
FROM foodly_order_history AS h
JOIN JSON_TABLE(
  h.items_json,
  '$[*]' COLUMNS (
    dish_id VARCHAR(80) PATH '$.id',
    dish_name VARCHAR(180) PATH '$.name',
    quantity INT PATH '$.quantity',
    unit_price_inr DECIMAL(12,2) PATH '$.price'
  )
) AS item ON TRUE;

-- Order history: who ordered, where, when and the order total.
SELECT order_id, customer_name, customer_email, restaurant_name,
       placed_at_ist, order_status, total_inr, payment_method,
       delivery_phone, delivery_address
FROM foodly_order_history
ORDER BY placed_at_epoch_ms DESC;

-- Individual dishes and quantities for every order.
SELECT order_id, customer_name, restaurant_name, placed_at_ist,
       dish_name, quantity, unit_price_inr, line_total_inr, order_status
FROM foodly_order_items
ORDER BY placed_at_epoch_ms DESC, order_id, dish_name;
