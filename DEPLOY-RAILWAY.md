# Publish Foodly from GitHub with Railway

The deployable application is on the `foodly-mysql` branch of `geethikashreee/food-ordering-delivery-system`. Use the repository root as the service root. GitHub Pages is static hosting; Foodly's authentication and MySQL APIs run on a Node.js server.

`railway.json` configures the build, database setup before deployment, server startup and `/api/health` readiness check. The health endpoint returns success only after it can query the orders table.

## Required Railway services

Create one project containing:

1. A MySQL service with persistent storage.
2. A web service connected to the GitHub repository and the `foodly-mysql` branch.

Wait until MySQL is ready before deploying the web service. This setup uses Railway's private network for the connection between the two services.

## Web service variables

If the database service is named `MySQL`, reference its variables in the web service as follows. Replace the service prefix if your database service has a different name.

```env
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}
MYSQL_SSL=false
FOODLY_HOST=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

`MYSQL_SSL=false` here applies specifically to the internal MySQL connection on Railway's private network. For an external MySQL provider, use the provider's required TLS settings instead.

Generate a domain for the web service and set:

```env
APP_URL=https://YOUR-GENERATED-DOMAIN.up.railway.app
```

Use the exact generated HTTPS origin. The application checks this origin when accepting sign-in, sign-up and order requests. Railway supplies `PORT`; the production start script reads it automatically.

The pre-deploy command runs migrations and creates the Workbench order-history views using the database name supplied by `MYSQL_DATABASE`. If you use the Workbench SQL worksheet separately, select that database or adjust its `USE food_db` line to match.

## Accounts and admin access

A new hosted database starts empty. Database setup does not automatically transfer the users or orders from your computer.

Create your own account on the live site. Then set this variable privately on the web service to give the existing trusted account admin access:

```env
FOODLY_ADMIN_EMAILS=YOUR-REGISTERED-FOODLY-EMAIL
```

New customer registrations remain customers. `/admin/orders` and its API both verify admin access on the server. No default passwords are included.

## Verify the launch

- `/api/health` returns `{"status":"ok","database":"mysql"}`.
- The home page, `/features`, `/sign-in` and `/create-account` load.
- Registration and sign-in create a session successfully.
- A demo checkout appears in My orders and, for the configured admin, Admin Orders.
- Orders are saved in the hosted MySQL database.

Railway's account connection and available hosting plan must be checked before starting deployment. This configuration file alone does not provision hosting or produce a live URL.

Official guides: [Next.js on Railway](https://railway.com/guides/nextjs), [MySQL](https://docs.railway.com/databases/mysql), [pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command), [configuration](https://docs.railway.com/config-as-code/reference).
