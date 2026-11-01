# Foodly

Food delivery and smarter ordering, built with Next.js, React, TypeScript, Drizzle ORM and MySQL 8.

## Included

- Restaurant menus, a persistent shopping bag, coupons, checkout and order tracking.
- Email/password registration, sign-in and database-backed sessions.
- **Foodly Hub** (`/features`) with Food Mood AI, Foodly Squad, Food Waste Rescue, Smart Queue, Smart Plate, Foodly Streaks, Delivery Pulse and Intelligence Lab.
- **Admin Orders** (`/admin/orders`) with customer, restaurant, status and date filters, item details, pagination and CSV export. Admin access is explicitly configured; ordinary customers can see only their own orders.
- SQL reports for MySQL Workbench showing who ordered, at which restaurant, when, and the items and totals.

This branch contains the current standalone Foodly application. The repository's older `main` branch is a separate React/Express project.

## Run locally

Requirements: Node.js 22.13 or newer and MySQL 8.0.

1. Copy `.env.example` to `.env.local` and fill in the same MySQL server details used in Workbench. Create the database named in `MYSQL_DATABASE` first (`food_db` by default).
2. For local MySQL without TLS, use `MYSQL_SSL=false`. For hosted MySQL, use your provider's TLS settings and optional CA certificate.
3. Keep `APP_URL=http://127.0.0.1:3000` while using that exact local address.
4. Run:

```sh
npm ci
npm run db:check
npm run db:setup
npm run dev -- --webpack
```

Open http://127.0.0.1:3000 and create your own Foodly account. No shared login credentials are included.

For admin access, put the email of an existing, trusted Foodly account in `FOODLY_ADMIN_EMAILS` inside `.env.local`. Additional trusted admins can be listed with commas. Each person uses their own sign-in credentials. Refresh the application after changing this setting.

## MySQL Workbench

Connect Workbench to the same MySQL server as Foodly. Open and execute `db/ORDER-HISTORY-WORKBENCH.sql`, or run `npm run db:reports` to install the views. The script displays customer and restaurant names, order times in India Standard Time, status, items, quantities, prices and totals.

See [Workbench order history](WORKBENCH-ORDER-HISTORY.md) and [Foodly Hub and admin setup](FOODLY-HUB-AND-ADMIN.md).

## Checks

```sh
npm run typecheck
npm test
npm run build
```

The interface suite includes routing, account forms, password hashing, date filters and administrator-access checks. Live MySQL checks require your own configured database.

## Deploy

Use a Node.js application host with a reachable MySQL server. Set the environment variables from `.env.example` privately on the host, set `APP_URL` to the public HTTPS origin, and configure the administrator email separately.

- Build: `npm ci && npm run build`
- Start: `npm start`
- Run database setup once before accepting orders.

This application includes server-side authentication and database APIs. GitHub Pages alone cannot run the complete application.

`.env.local`, database passwords, runtime data, dependencies and build output are excluded from version control. The committed `.env.example` contains placeholders only.

Foodly uses a demo menu and demo fulfilment stages. No real restaurant, payment processor or courier service is contacted. Email verification and password recovery are not configured.


## Railway deployment

See [Deploy Foodly on Railway](DEPLOY-RAILWAY.md). The included railway.json configures the build, database setup, server startup and readiness check.
