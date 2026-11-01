import { eq, and, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { orders, squads, squadMembers, rescueInventory } from '../db/schema';
import { restaurants } from './catalog';
import { rescueDeals, rescueWindow, queueEstimate, rewardSummary, indiaDay, type Squad } from './foodly';
import { priceCart } from './pricing';
export async function rescueOffers(now=Date.now()){
 const db=getDb(),{day,expiresAt}=rescueWindow(now);
 await db.insert(rescueInventory).values(rescueDeals.map(d=>({id:day+':'+d.id,dealId:d.id,remaining:d.stock,expiresAt}))).onDuplicateKeyUpdate({set:{id:sql`${rescueInventory.id}`}});
 const rows=await db.select().from(rescueInventory).where(inArray(rescueInventory.id,rescueDeals.map(d=>day+':'+d.id)));
 return rescueDeals.map(d=>{const row=rows.find(r=>r.dealId===d.id)!;return {...d,key:row.id,remaining:row.expiresAt>now?row.remaining:0,expiresAt:row.expiresAt};});
}
export async function workloads(){
 const rows=await getDb().select({restaurantId:orders.restaurantId,items:orders.items,schedule:orders.schedule}).from(orders).where(inArray(orders.status,['Placed','Preparing']));
 const totals:Record<string,number>={};for(const row of rows){if(row.schedule!=='ASAP'&&Date.parse(row.schedule)>Date.now()+3600000)continue;const amount=JSON.parse(row.items).reduce((s:number,i:{quantity:number})=>s+i.quantity,0);totals[row.restaurantId]=(totals[row.restaurantId]||0)+amount;}return totals;
}
export async function squadAccess(id:string,userId:string,db=getDb(),lock=false){
 const query=db.select().from(squads).where(eq(squads.id,id)).limit(1);const [group]=await(lock?query.for('update'):query);if(!group)throw Error('Squad not found.');
 const members=await db.select().from(squadMembers).where(eq(squadMembers.squadId,id));
 if(group.ownerId!==userId&&!members.some(m=>m.userId===userId))throw Error('Squad not found.');return {group,members};
}
export async function squadView(id:string,userId:string):Promise<Squad>{
 const {group,members}=await squadAccess(id,userId);
 return {id:group.id,code:group.code,title:group.title,restaurantId:group.restaurantId,budget:group.budget,state:group.state,owner:group.ownerId===userId,orderId:group.orderId,myMemberId:members.find(m=>m.userId===userId)?.id||null,members:members.map(m=>({id:m.id,name:m.name,userId:m.userId?'account':null,picks:JSON.parse(m.picks),ready:!!m.ready}))};
}
export function aggregateSquad(group:typeof squads.$inferSelect,members:typeof squadMembers.$inferSelect[]){
 if(!members.length||members.some(m=>!m.ready))throw Error('Everyone needs to choose a dish and mark ready first.');
 const amounts=new Map<string,number>();for(const m of members){const picks=JSON.parse(m.picks);if(!picks.length)throw Error('Every person needs at least one dish.');for(const i of picks)amounts.set(i.id,(amounts.get(i.id)||0)+i.quantity);}
 const items=[...amounts].map(([id,quantity])=>({id,quantity}));const bill=priceCart(group.restaurantId,items);
 if(bill.subtotal>group.budget)throw Error('Your squad is over its food budget. Edit choices or increase the budget before locking.');return {items,bill};
}
export async function insights(userId:string){
 const rows=await getDb().select({status:orders.status,subtotal:orders.subtotal,discount:orders.discount,total:orders.total,items:orders.items,restaurantName:orders.restaurantName,createdAt:orders.createdAt,updatedAt:orders.updatedAt,rescueDealId:orders.rescueDealId}).from(orders).where(eq(orders.userId,userId));
 const delivered=rows.filter(o=>o.status==='Delivered'),live=rows.filter(o=>!['Cancelled','Delivered'].includes(o.status));
 const popularity:Record<string,{name:string;units:number;sales:number}>={};for(const o of rows.filter(o=>o.status!=='Cancelled'))for(const i of JSON.parse(o.items)){const row=popularity[i.id]||{name:i.name,units:0,sales:0};row.units+=i.quantity;row.sales+=i.price*i.quantity;popularity[i.id]=row;}
 const week=Array.from({length:7},(_,i)=>{const day=indiaDay(Date.now()-(6-i)*86400000);const dayRows=rows.filter(o=>indiaDay(o.createdAt)===day);return {day,orders:dayRows.length,delivered:dayRows.filter(o=>o.status==='Delivered').length};});
 const completedValue=delivered.reduce((s,o)=>s+o.total,0);
 return {rewards:rewardSummary(delivered),analytics:{totalOrders:rows.length,completedValue,activeOrders:live.length,averageOrder:delivered.length?Math.round(completedValue/delivered.length):0,delivered:delivered.length,cancelled:rows.filter(o=>o.status==='Cancelled').length,popular:Object.values(popularity).sort((a,b)=>b.units-a.units),week,distribution:['Placed','Preparing','Out for delivery','Delivered','Cancelled'].map(status=>({status,count:rows.filter(o=>o.status===status).length})),rescueOrders:delivered.filter(o=>o.rescueDealId).length}};
}
