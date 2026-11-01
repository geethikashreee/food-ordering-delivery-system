import 'server-only';
import mysql from 'mysql2/promise';
import {drizzle,type MySql2Database} from 'drizzle-orm/mysql2';
import {mysqlOptions} from './config.mjs';
import * as schema from './schema';
type Database=MySql2Database<typeof schema>;
const state=globalThis as typeof globalThis&{foodlyMysqlPool?:mysql.Pool;foodlyMysqlDb?:Database};
export function getPool(){return state.foodlyMysqlPool??=mysql.createPool({...mysqlOptions(),waitForConnections:true,connectionLimit:8,queueLimit:100,enableKeepAlive:true});}
export function getDb():Database{return state.foodlyMysqlDb??=drizzle(getPool(),{schema,mode:'default'});}
export async function transaction<T>(fn:(db:Database)=>Promise<T>):Promise<T>{
 for(let attempt=0;attempt<3;attempt++){
  const connection=await getPool().getConnection();
  try{await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');await connection.beginTransaction();const result=await fn(drizzle(connection,{schema,mode:'default'}));await connection.commit();return result;}
  catch(error){await connection.rollback();const code=(error as {cause?:{code?:string}}).cause?.code||(error as {code?:string}).code;if(attempt<2&&['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(code||''))continue;throw error;}
  finally{connection.release();}
 }
 throw Error('Transaction retry limit reached.');
}
