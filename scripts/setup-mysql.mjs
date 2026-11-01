import mysql from 'mysql2/promise';
import {fileURLToPath} from 'node:url';
import {drizzle} from 'drizzle-orm/mysql2';
import {migrate} from 'drizzle-orm/mysql2/migrator';
import {mysqlOptions} from '../db/config.mjs';
import {installOrderHistoryViews} from './order-history-views.mjs';
const pool=mysql.createPool({...mysqlOptions(),connectionLimit:1});
try{await migrate(drizzle(pool),{migrationsFolder:fileURLToPath(new URL('../drizzle',import.meta.url))});await installOrderHistoryViews(pool);console.log('Foodly MySQL tables and order history views are ready.');}finally{await pool.end();}
