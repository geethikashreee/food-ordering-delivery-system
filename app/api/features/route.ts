import {NextResponse} from 'next/server';
import {eq,sql,or,desc} from 'drizzle-orm';
import {getCurrentUser} from '../../auth';
import {getDb,transaction} from '../../../db';
import {squads,squadMembers} from '../../../db/schema';
import {restaurants} from '../../catalog';
import {queueEstimate} from '../../foodly';
import {priceCart} from '../../pricing';
import {rescueOffers,workloads,insights,squadAccess,squadView,aggregateSquad} from '../../foodly-server';
import {checkOrigin,readBody,fail,errorResponse} from '../../../lib/http';
export const dynamic='force-dynamic';export const runtime='nodejs';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{
 const user=await getCurrentUser();const [rescue,load]=await Promise.all([rescueOffers(),workloads()]);
 if(!user)return json({rescue,queues:restaurants.map(r=>queueEstimate(r.id,1,1,load[r.id]||0)),squads:[],rewards:null,analytics:null});
 const db=getDb(),[data,groups]=await Promise.all([insights(user.userId),db.select({id:squads.id}).from(squads).where(or(eq(squads.ownerId,user.userId),sql`${squads.id} IN (SELECT squad_id FROM squad_members WHERE user_id=${user.userId})`)).orderBy(desc(squads.createdAt)).limit(20)]);
 return json({...data,rescue,queues:restaurants.map(r=>queueEstimate(r.id,1,1,load[r.id]||0)),squads:await Promise.all(groups.map(g=>squadView(g.id,user.userId)))});
}catch(error){return errorResponse(error);}}
export async function POST(request:Request){try{
 checkOrigin(request);const user=await getCurrentUser();if(!user)fail('Please sign in to use your Foodly workspace.',401);const b=await readBody(request,16000),now=Date.now();
 if(b.action==='estimate'){
  const rid=String(b.restaurantId),quantity=Number(b.quantity),distinct=Number(b.distinct||1);
  if(!restaurants.some(r=>r.id===rid)||!Number.isInteger(quantity)||quantity<1||quantity>100||!Number.isInteger(distinct)||distinct<1||distinct>30||distinct>quantity)fail('Choose a valid restaurant and item count.');
  const load=await workloads();return json({estimate:queueEstimate(rid,quantity,distinct,load[rid]||0)});
 }
 if(b.action==='create'){
  const title=String(b.title||'').trim(),rid=String(b.restaurantId),budget=Number(b.budget),name=String(b.name||user.displayName).trim().slice(0,50);
  if(title.length<2||title.length>70||!restaurants.some(r=>r.id===rid)||!Number.isInteger(budget)||budget<99||budget>20000||!name)fail('Add a squad name, a restaurant and a food budget from ₹99 to ₹20,000.');
  const id=crypto.randomUUID(),code=crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase();
  await transaction(async tx=>{await tx.insert(squads).values({id,code,ownerId:user.userId,title,restaurantId:rid,budget,createdAt:now,updatedAt:now});await tx.insert(squadMembers).values({id:crypto.randomUUID(),squadId:id,userId:user.userId,name,picks:'[]',ready:0});});return json({squad:await squadView(id,user.userId)},201);
 }
 if(b.action==='join'){
  const code=String(b.code||'').trim().toUpperCase();if(!/^[A-Z0-9]{8}$/.test(code))fail('Enter an 8-character squad code.');
  const id=await transaction(async tx=>{
   const [group]=await tx.select().from(squads).where(eq(squads.code,code)).limit(1).for('update');if(!group)fail('Squad not found. Check your code.',404);
   const members=await tx.select().from(squadMembers).where(eq(squadMembers.squadId,group.id));if(members.some(m=>m.userId===user.userId))return group.id;
   if(group.state!=='open'||members.length>=20)fail('This squad is locked or full. Ask the host to reopen it.',409);
   await tx.insert(squadMembers).values({id:crypto.randomUUID(),squadId:group.id,userId:user.userId,name:String(b.name||user.displayName).trim().slice(0,50)||'Foodly friend',picks:'[]',ready:0});await tx.update(squads).set({revision:sql`${squads.revision}+1`,updatedAt:now}).where(eq(squads.id,group.id));return group.id;
  });return json({squad:await squadView(id,user.userId)});
 }
 const id=await transaction(async tx=>{
  let access;try{access=await squadAccess(String(b.squadId),user.userId,tx,true);}catch{fail('Squad not found.',404);}const {group,members}=access;const host=group.ownerId===user.userId;
  if(b.action==='guest'){
   if(!host)fail('Only the host can add people at this table.',403);const name=String(b.name||'').trim();if(!name||name.length>50)fail('Enter a name up to 50 characters.');if(group.state!=='open'||members.length>=20)fail('Reopen your squad first. Each squad can have up to 20 people.',409);
   await tx.insert(squadMembers).values({id:crypto.randomUUID(),squadId:group.id,userId:null,name,picks:'[]',ready:0});
  }else if(b.action==='picks'){
   const member=members.find(m=>m.id===b.memberId);if(!member||!(member.userId===user.userId||(host&&member.userId===null)))fail('You can edit only your own choices or the host’s guest seats.',403);
   if(group.state!=='open')fail('This squad is locked. Ask the host to reopen it.',409);if(!Array.isArray(b.picks)||b.picks.length>20)fail('Choose valid menu items.');
   if(b.picks.length)try{priceCart(group.restaurantId,b.picks);}catch(error){fail((error as Error).message);}if(b.ready&&!b.picks.length)fail('Choose at least one dish before marking ready.');
   await tx.update(squadMembers).set({picks:JSON.stringify(b.picks.map((i:{id:string;quantity:number})=>({id:i.id,quantity:i.quantity}))),ready:b.ready?1:0}).where(eq(squadMembers.id,member.id));
  }else if(b.action==='lock'||b.action==='unlock'){
   if(!host)fail('Only the host can lock or reopen this squad.',403);if(group.state!==(b.action==='lock'?'open':'locked'))fail('Your squad changed. Refresh and try again.',409);
   if(b.action==='lock')try{aggregateSquad(group,members);}catch(error){fail((error as Error).message);}await tx.update(squads).set({state:b.action==='lock'?'locked':'open'}).where(eq(squads.id,group.id));
  }else if(b.action==='budget'){
   if(!host)fail('Only the host can set the budget.',403);const budget=Number(b.budget);if(!Number.isInteger(budget)||budget<99||budget>20000)fail('Budget must be between ₹99 and ₹20,000.');if(group.state!=='open')fail('Reopen the squad to change its budget.',409);await tx.update(squads).set({budget}).where(eq(squads.id,group.id));
  }else fail('Unknown action.');
  await tx.update(squads).set({revision:sql`${squads.revision}+1`,updatedAt:now}).where(eq(squads.id,group.id));return group.id;
 });return json({squad:await squadView(id,user.userId)});
}catch(error){return errorResponse(error);}}
