import fs from 'node:fs/promises';
export async function installOrderHistoryViews(connection){
 const source=await fs.readFile(new URL('../db/order-history-views.sql',import.meta.url),'utf8');
 for(const statement of source.split(';').map(value=>value.trim()).filter(Boolean))await connection.query(statement);
}
