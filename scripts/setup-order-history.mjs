import mysql from 'mysql2/promise';
import {mysqlOptions} from '../db/config.mjs';
import {installOrderHistoryViews} from './order-history-views.mjs';
const options=mysqlOptions();
const connection=await mysql.createConnection(options);
try{
 await installOrderHistoryViews(connection);
 const [counts]=await connection.query('SELECT COUNT(*) AS orders FROM foodly_order_history');
 console.log('Order history views are ready in '+options.database+'. Existing orders: '+counts[0].orders+'.');
 console.log('In Workbench run: SELECT * FROM foodly_order_history ORDER BY placed_at_epoch_ms DESC;');
}finally{await connection.end();}
