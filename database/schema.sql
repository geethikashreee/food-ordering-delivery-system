CREATE DATABASE IF NOT EXISTS food_delivery;
USE food_delivery;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_status_log, reviews, deliveries, payments, order_items, orders, menu_items, restaurants, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============ TABLES ============
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  role ENUM('CUSTOMER','PARTNER','ADMIN') DEFAULT 'CUSTOMER'
);
CREATE TABLE restaurants (
  restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cuisine VARCHAR(50),
  city VARCHAR(50),
  avg_rating DECIMAL(2,1) DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE
);
CREATE TABLE menu_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(8,2) NOT NULL CHECK (price > 0),
  is_available BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  status ENUM('PLACED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') DEFAULT 'PLACED',
  total_amount DECIMAL(10,2) NOT NULL,
  order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);
CREATE TABLE order_items (
  order_id INT, item_id INT, quantity INT NOT NULL, unit_price DECIMAL(8,2) NOT NULL,
  PRIMARY KEY (order_id, item_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNIQUE NOT NULL,
  method ENUM('UPI','CARD','COD') NOT NULL,
  status ENUM('SUCCESS','FAILED','PENDING') DEFAULT 'PENDING',
  paid_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
CREATE TABLE deliveries (
  delivery_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNIQUE NOT NULL,
  partner_id INT NOT NULL,
  picked_at DATETIME,
  delivered_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (partner_id) REFERENCES users(user_id)
);
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNIQUE NOT NULL,
  user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);
CREATE TABLE order_status_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ INDEXES (compare with EXPLAIN before/after) ============
CREATE INDEX idx_orders_time ON orders(order_time);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);

-- ============ VIEWS (power the dashboard panels) ============
CREATE VIEW vw_daily_revenue AS
  SELECT DATE(order_time) AS day, COUNT(*) AS orders, SUM(total_amount) AS revenue
  FROM orders WHERE status <> 'CANCELLED' GROUP BY DATE(order_time);

CREATE VIEW vw_restaurant_stats AS
  SELECT r.restaurant_id, r.name, r.cuisine, r.city, r.is_open, r.avg_rating,
         COUNT(o.order_id) AS orders,
         COALESCE(SUM(CASE WHEN o.status <> 'CANCELLED' THEN o.total_amount END), 0) AS revenue
  FROM restaurants r LEFT JOIN orders o ON o.restaurant_id = r.restaurant_id
  GROUP BY r.restaurant_id;

CREATE VIEW vw_top_items AS
  SELECT m.name AS item, r.name AS restaurant, SUM(oi.quantity) AS units
  FROM order_items oi
  JOIN menu_items m ON m.item_id = oi.item_id
  JOIN restaurants r ON r.restaurant_id = m.restaurant_id
  JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
  GROUP BY m.item_id ORDER BY units DESC;

CREATE VIEW vw_delivery_perf AS
  SELECT u.name AS partner, COUNT(*) AS deliveries,
         ROUND(AVG(TIMESTAMPDIFF(MINUTE, o.order_time, d.delivered_at))) AS avg_minutes
  FROM deliveries d
  JOIN users u ON u.user_id = d.partner_id
  JOIN orders o ON o.order_id = d.order_id
  WHERE d.delivered_at IS NOT NULL GROUP BY u.user_id;

-- ============ TRIGGERS ============
DELIMITER //
CREATE TRIGGER trg_review_rating AFTER INSERT ON reviews FOR EACH ROW
BEGIN
  UPDATE restaurants
  SET avg_rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = NEW.restaurant_id)
  WHERE restaurant_id = NEW.restaurant_id;
END//

CREATE TRIGGER trg_order_status_log AFTER UPDATE ON orders FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO order_status_log(order_id, old_status, new_status) VALUES (NEW.order_id, OLD.status, NEW.status);
  END IF;
END//

-- ============ STORED PROCEDURES ============
CREATE PROCEDURE sp_update_order_status(IN p_id INT, IN p_status VARCHAR(20))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
    UPDATE orders SET status = p_status WHERE order_id = p_id;
    IF p_status = 'DELIVERED' THEN
      UPDATE deliveries SET delivered_at = NOW() WHERE order_id = p_id AND delivered_at IS NULL;
    END IF;
  COMMIT;
END//

CREATE PROCEDURE sp_seed(IN n INT)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE v_oid, v_rid, v_iid, v_qty INT;
  DECLARE v_price DECIMAL(8,2);
  DECLARE v_st VARCHAR(20);
  DECLARE v_t DATETIME;
  DECLARE v_r DOUBLE;
  WHILE i < n DO
    SET v_rid = 1 + FLOOR(RAND() * 5);
    SET v_t = NOW() - INTERVAL FLOOR(RAND() * 30 * 24 * 60) MINUTE;
    SET v_r = RAND();
    SET v_st = IF(v_r < 0.78, 'DELIVERED', IF(v_r < 0.85, 'CANCELLED', IF(v_r < 0.90, 'OUT_FOR_DELIVERY', IF(v_r < 0.95, 'PREPARING', 'PLACED'))));
    INSERT INTO orders(user_id, restaurant_id, status, total_amount, order_time)
      VALUES (1 + FLOOR(RAND() * 6), v_rid, v_st, 0, v_t);
    SET v_oid = LAST_INSERT_ID();
    SELECT item_id, price INTO v_iid, v_price FROM menu_items WHERE restaurant_id = v_rid ORDER BY RAND() LIMIT 1;
    SET v_qty = 1 + FLOOR(RAND() * 3);
    INSERT INTO order_items VALUES (v_oid, v_iid, v_qty, v_price);
    UPDATE orders SET total_amount = v_qty * v_price + 40 WHERE order_id = v_oid;
    INSERT INTO payments(order_id, method, status, paid_at)
      VALUES (v_oid, ELT(1 + FLOOR(RAND() * 3), 'UPI', 'CARD', 'COD'), IF(v_st = 'CANCELLED', 'FAILED', 'SUCCESS'), v_t);
    IF v_st = 'DELIVERED' THEN
      INSERT INTO deliveries(order_id, partner_id, picked_at, delivered_at)
        VALUES (v_oid, 7 + FLOOR(RAND() * 3), v_t + INTERVAL 15 MINUTE, v_t + INTERVAL (30 + FLOOR(RAND() * 30)) MINUTE);
      IF RAND() < 0.6 THEN
        INSERT INTO reviews(order_id, user_id, restaurant_id, rating, comment, created_at)
          VALUES (v_oid, (SELECT user_id FROM orders WHERE order_id = v_oid), v_rid, 2 + FLOOR(RAND() * 4),
                  ELT(1 + FLOOR(RAND() * 4), 'Great food', 'Late but tasty', 'Cold on arrival', 'Loved it'), v_t + INTERVAL 90 MINUTE);
      END IF;
    END IF;
    SET i = i + 1;
  END WHILE;
END//
DELIMITER ;

-- ============ SAMPLE DATA ============
INSERT INTO users(name, email, phone, role) VALUES
 ('Aarav','aarav@mail.com','9000000001','CUSTOMER'),('Meera','meera@mail.com','9000000002','CUSTOMER'),
 ('Karthik','karthik@mail.com','9000000003','CUSTOMER'),('Divya','divya@mail.com','9000000004','CUSTOMER'),
 ('Surya','surya@mail.com','9000000005','CUSTOMER'),('Nila','nila@mail.com','9000000006','CUSTOMER'),
 ('Ravi (rider)','ravi@mail.com','9000000007','PARTNER'),('Salim (rider)','salim@mail.com','9000000008','PARTNER'),
 ('Anitha (rider)','anitha@mail.com','9000000009','PARTNER'),('Admin','admin@mail.com','9000000010','ADMIN');
INSERT INTO restaurants(name, cuisine, city) VALUES
 ('Salem RR Biriyani','Biryani','Salem'),('Dosa Corner','South Indian','Salem'),('Pizza Hub','Italian','Salem'),
 ('Wok Express','Chinese','Salem'),('Sweet Tooth','Desserts','Salem');
INSERT INTO menu_items(restaurant_id, name, price) VALUES
 (1,'Chicken Biryani',220),(1,'Mutton Biryani',320),(1,'Veg Biryani',160),(1,'Raita',40),
 (2,'Masala Dosa',90),(2,'Idli Set',60),(2,'Pongal',70),(2,'Filter Coffee',30),
 (3,'Margherita',240),(3,'Farmhouse',320),(3,'Garlic Bread',120),(3,'Pasta Alfredo',260),
 (4,'Veg Fried Rice',150),(4,'Chilli Chicken',210),(4,'Hakka Noodles',160),(4,'Manchurian',140),
 (5,'Brownie',110),(5,'Gulab Jamun',80),(5,'Ice Cream Sundae',130),(5,'Rasmalai',100);
CALL sp_seed(250);
