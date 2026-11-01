import {NextResponse} from 'next/server';
import {and,eq,desc,sql} from 'drizzle-orm';
import {getCurrentUser} from '../../auth';
import {isAdminEmail} from '../../../lib/admin-access';
import {getDb,transaction} from '../../../db';
import {orders,profiles,rescueInventory,squads} from '../../../db/schema';
import {priceCart} from '../../pricing';
import {restaurants,statuses} from '../../catalog';
import {queueEstimate} from '../../foodly';
import {rescueOffers,workloads,squadAccess,aggregateSquad} from '../../foodly-server';
import {checkOrigin,readBody,fail,errorResponse} from '../../../lib/http';
export const dynamic='force-dynamic';export const runtime='nodejs';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const unpack=(o:typeof orders.$inferSelect)=>({...o,userId:undefined,requestKey:undefined,items:JSON.parse(o.items),events:JSON.parse(o.events)});
export async function GET(){try{const user=await getCurrentUser();if(!user)return json({user:null,orders:[],profile:null});const db=getDb();const [history,profileRows]=await Promise.all([db.select().from(orders).where(eq(orders.userId,user.userId)).orderBy(desc(orders.createdAt)).limit(200),db.select().from(profiles).where(eq(profiles.userId,user.userId)).limit(1)]);const profile=profileRows[0];return json({user:{name:user.displayName,email:user.email,isAdmin:isAdminEmail(user.email)},orders:history.map(unpack),profile:profile?{...profile,userId:undefined,favourites:JSON.parse(profile.favourites)}:null});}catch(error){return errorResponse(error);}}
export async function POST(request:Request){try{
 checkOrigin(request);const user=await getCurrentUser();if(!user)fail('Please sign in before saving your order.',401);const b=await readBody(request),db=getDb();
 if(b.action==='profile'){
  const name=String(b.name||'').trim().slice(0,80),address=String(b.address||'').trim().slice(0,500),phone=String(b.phone||'').trim().slice(0,20),favourites=Array.isArray(b.favourites)?[...new Set(b.favourites.filter((id:unknown)=>restaurants.some(r=>r.id===id)))]:[];
  await db.insert(profiles).values({userId:user.userId,name,address,phone,favourites:JSON.stringify(favourites)}).onDuplicateKeyUpdate({set:{name,address,phone,favourites:JSON.stringify(favourites)}});return json({ok:true});
 }
 if(b.action==='order'){
  if(typeof b.requestKey!=='string'||!/^[a-zA-Z0-9-]{10,80}$/.test(b.requestKey))fail('Please retry your checkout.');const key=and(eq(orders.userId,user.userId),eq(orders.requestKey,b.requestKey));const [previous]=await db.select().from(orders).where(key).limit(1);if(previous)return json({order:unpack(previous)});
  if(typeof b.restaurantId!=='string'||typeof b.coupon!=='string')fail('Invalid checkout.');const rescueId=b.rescueDealId?String(b.rescueDealId):null,squadId=b.squadId?String(b.squadId):null;if(rescueId&&squadId)fail('Rescue bags and squad orders use separate checkouts.');
  let bill:ReturnType<typeof priceCart>;try{bill=priceCart(b.restaurantId,b.items,b.coupon,rescueId);}catch(error){fail((error as Error).message);}
  const address=String(b.address||'').trim(),phone=String(b.phone||'').trim(),note=String(b.note||'').trim(),schedule=String(b.schedule||'ASAP');if(address.length<10||address.length>500)fail('Enter a complete delivery address (10–500 characters).');if(!/^[6-9]\d{9}$/.test(phone))fail('Enter a valid 10-digit Indian mobile number.');if(note.length>300)fail('Keep delivery instructions under 300 characters.');
  if(schedule!=='ASAP'){const time=Date.parse(schedule);if(!Number.isFinite(time)||time<Date.now()+15*60000||time>Date.now()+7*86400000)fail('Schedule delivery between 15 minutes and 7 days from now.');}
  let offer:Awaited<ReturnType<typeof rescueOffers>>[number]|undefined;if(rescueId){if(schedule!=='ASAP')fail('Rescue meals are available for immediate delivery only.');offer=(await rescueOffers()).find(d=>d.id===rescueId);if(!offer)fail('Rescue offer not found.',404);}
  const load=await workloads(),estimate=queueEstimate(b.restaurantId,bill.items.reduce((s,i)=>s+i.quantity,0),bill.items.length,load[b.restaurantId]||0),now=Date.now();
  const result=await transaction(async tx=>{
   if(offer){const [stock]=await tx.select().from(rescueInventory).where(eq(rescueInventory.id,offer.key)).limit(1).for('update');const [existing]=await tx.select().from(orders).where(key).limit(1);if(existing)return existing;if(!stock||stock.remaining<bill.items[0].quantity||stock.expiresAt<=Date.now())fail('That rescue offer is sold out or expired. Choose another meal.',409);}
   if(squadId){let access;try{access=await squadAccess(squadId,user.userId,tx,true);}catch{fail('Squad not found.',404);}if(access.group.ownerId!==user.userId)fail('Only the host can check out this squad.',403);
    const [retried]=await tx.select().from(orders).where(key).limit(1);if(retried)return retried;if(access.group.state!=='locked')fail('This squad is not locked or was already ordered.',409);if(access.group.restaurantId!==b.restaurantId)fail('The squad restaurant does not match your bag.');
    let groupCart;try{groupCart=aggregateSquad(access.group,access.members);}catch(error){fail((error as Error).message);}const normalize=(items:{id:string;quantity:number}[])=>JSON.stringify([...items].map(i=>({id:i.id,quantity:i.quantity})).sort((a,b)=>a.id.localeCompare(b.id)));if(normalize(groupCart.items)!==normalize(b.items))fail('Your bag must match everyone’s locked squad choices.');
   }
   const [retried]=await tx.select().from(orders).where(key).limit(1);if(retried)return retried;
   const record={id:crypto.randomUUID(),userId:user.userId,requestKey:b.requestKey,restaurantId:bill.restaurant.id,restaurantName:bill.restaurant.name,items:JSON.stringify(bill.items),subtotal:bill.subtotal,discount:bill.discount,delivery:bill.delivery,tax:bill.tax,total:bill.total,coupon:bill.coupon,address,phone,note,schedule,payment:'Cash on delivery',status:'Placed',events:JSON.stringify([{status:'Placed',at:now}]),preparationMinutes:estimate.preparationMinutes,queueMinutes:estimate.queueMinutes,rescueDealId:rescueId,rescueKey:offer?.key||null,squadId,createdAt:now,updatedAt:now};
   await tx.insert(orders).values(record);if(offer)await tx.update(rescueInventory).set({remaining:sql`${rescueInventory.remaining}-${bill.items[0].quantity}`}).where(eq(rescueInventory.id,offer.key));if(squadId)await tx.update(squads).set({state:'ordered',orderId:record.id,revision:sql`${squads.revision}+1`,updatedAt:now}).where(eq(squads.id,squadId));return record;
  }).catch(async error=>{const code=(error as {cause?:{code?:string};code?:string}).cause?.code||(error as {code?:string}).code;if(code==='ER_DUP_ENTRY'){const [existing]=await db.select().from(orders).where(key).limit(1);if(existing)return existing;fail('This squad was already checked out.',409);}throw error;});return json({order:unpack(result)},201);
 }
 if(b.action==='status'){
  const orderId=String(b.id),next=String(b.status),[snapshot]=await db.select().from(orders).where(and(eq(orders.id,orderId),eq(orders.userId,user.userId))).limit(1);if(!snapshot)fail('Order not found.',404);
  const updated=await transaction(async tx=>{
   if(next==='Cancelled'&&snapshot.rescueKey)await tx.select().from(rescueInventory).where(eq(rescueInventory.id,snapshot.rescueKey)).limit(1).for('update');
   const [order]=await tx.select().from(orders).where(and(eq(orders.id,orderId),eq(orders.userId,user.userId))).limit(1).for('update');if(!order)fail('Order not found.',404);
   const index=statuses.indexOf(order.status as typeof statuses[number]),allowed=(next==='Cancelled'&&order.status==='Placed')||(index>=0&&index<statuses.length-1&&next===statuses[index+1]);if(!allowed)fail('That order status change is not available.');
   const now=Date.now(),events=JSON.parse(order.events);if(!events.length)events.push({status:'Placed',at:order.createdAt});events.push({status:next,at:now});if(next==='Cancelled'&&order.rescueKey){const amount=JSON.parse(order.items).reduce((n:number,i:{quantity:number})=>n+i.quantity,0);await tx.update(rescueInventory).set({remaining:sql`${rescueInventory.remaining}+${amount}`}).where(eq(rescueInventory.id,order.rescueKey));}
   await tx.update(orders).set({status:next,updatedAt:now,events:JSON.stringify(events)}).where(eq(orders.id,order.id));return {...order,status:next,updatedAt:now,events:JSON.stringify(events)};
  });return json({order:unpack(updated)});
 }
 fail('Unknown action.');
}catch(error){return errorResponse(error);}}

