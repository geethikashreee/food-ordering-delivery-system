# Foodly Hub and admin order history

All eight customer features are on `/features`, named **Foodly Hub** in the top navigation beside Offers. The overview lists the tools; selecting one opens it inside the same page. Old feature URLs redirect to the corresponding tool in Foodly Hub.

The separate `/admin/orders` page displays customer orders across restaurants. It supports customer/email/order/restaurant search, status and restaurant filters, date ranges in India time, pagination, order details, and exporting the visible results page to CSV. Details include the order's items, quantities, prices, address, mobile number, payment preference, totals and saved status events.

## Assign administrators

Ordinary registrations remain customer accounts. Admin access is denied until a Foodly account is explicitly listed in `FOODLY_ADMIN_EMAILS` inside the project's `.env.local`:

```env
FOODLY_ADMIN_EMAILS=your-existing-foodly-account@example.com
```

Use the email of an existing account whose owner you trust. For this project, begin with your own account as the only admin. Multiple trusted accounts can be added later as a comma-separated list. Each admin keeps their own sign-in credentials. The admin page and its API both check permissions on the server.

After changing the setting, refresh the page. Your account menu and Foodly Hub will show **Admin orders**. Customer accounts can continue using **My orders**, which returns only their own orders. Creating an ordinary account never grants admin access.

## Show order history in Workbench

Open `db/ORDER-HISTORY-WORKBENCH.sql` in MySQL Workbench and execute the complete script while connected to Foodly's MySQL server. Alternatively run `npm run db:reports` from this project, then query:

```sql
USE food_db;
SELECT customer_name, customer_email, restaurant_name,
       placed_at_ist, order_status, total_inr
FROM foodly_order_history
ORDER BY placed_at_epoch_ms DESC;
```

The reporting view shows existing orders and automatically includes future successful checkouts. `foodly_order_items` expands each order into individual dishes and quantities. There are no fabricated orders in these scripts. This administrative database view is separate from the customer-facing order-history API.
