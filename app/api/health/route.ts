import {sql} from 'drizzle-orm';
import {getDb} from '../../../db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await getDb().execute(sql`SELECT 1 FROM orders LIMIT 1`);return Response.json({status:'ok',database:'mysql'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'unavailable',database:'mysql'},{status:503,headers:{'Cache-Control':'no-store'}});}}
