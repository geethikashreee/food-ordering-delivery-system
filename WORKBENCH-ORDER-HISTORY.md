# Order history in MySQL Workbench

The website saves completed checkouts to MySQL's `orders` table. Each row includes the account's `user_id`, the restaurant name, item prices and quantities, totals, delivery details, status, and Unix timestamps in milliseconds.

## Show who placed each order

Open `db/ORDER-HISTORY-WORKBENCH.sql` in MySQL Workbench while connected to the same MySQL server as Foodly. Execute the complete script. It creates two reporting views and then displays their results. It does not insert, alter or delete orders.

- `foodly_order_history`: one row per order, including customer name/email, restaurant, order time, current status, order totals and delivery details.
- `foodly_order_items`: one row per ordered dish, including quantity, unit price and line total.

`placed_at_ist` and `updated_at_ist` use India Standard Time. `placed_at_utc` and `placed_at_epoch_ms` are also available. Customer names use the saved profile name when available and otherwise the registered account name.

You can also install just the views from the project terminal:

```sh
npm run db:reports
```

Then run this in a Workbench query tab:

```sql
USE food_db;
SELECT customer_name, customer_email, restaurant_name,
       placed_at_ist, order_status, total_inr
FROM foodly_order_history
ORDER BY placed_at_epoch_ms DESC;
```

New orders appear in these views immediately after successful checkout. Run the SELECT again to refresh the result grid. If there are no orders yet, the result will be empty. Sign-ups alone do not create orders. A successful retry of the same checkout keeps a single order record.

The views require MySQL 8.0 and an account with CREATE VIEW and the relevant table permissions. They include every customer's orders visible to the database account executing the query. Website order history continues to show only the signed-in customer's orders.

References: [MySQL views](https://dev.mysql.com/doc/refman/8.4/en/create-view.html), [JSON_TABLE](https://dev.mysql.com/doc/refman/8.0/en/json-table-functions.html).
