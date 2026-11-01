import mysql from 'mysql2/promise';
import {mysqlOptions} from '../db/config.mjs';
const connection=await mysql.createConnection(mysqlOptions());
try{const [rows]=await connection.query('SELECT DATABASE() AS db, VERSION() AS version');console.log('Connected to MySQL '+rows[0].version+' / database '+rows[0].db);}finally{await connection.end();}
