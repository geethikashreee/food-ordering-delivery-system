import 'server-only';
import {cookies} from 'next/headers';
import {createHash,randomBytes} from 'node:crypto';
import {hashPassword,verifyPassword,DUMMY_PASSWORD_HASH} from '../lib/password';
import {and,eq,gt,sql} from 'drizzle-orm';
import {getDb} from '../db';
import {users,sessions,authAttempts} from '../db/schema';
import {fail} from '../lib/http';
export const SESSION_COOKIE='foodly_session';
const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export type CurrentUser={userId:string;displayName:string;email:string};
export async function getCurrentUser():Promise<CurrentUser|null>{const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const [row]=await getDb().select({userId:users.id,displayName:users.name,email:users.email}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.id,hashToken(token)),gt(sessions.expiresAt,Date.now()))).limit(1);return row||null;}
async function limit(key:string,maximum:number){const db=getDb(),id=hashToken(key),now=Date.now(),resetAt=now+15*60000;await db.insert(authAttempts).values({id,attempts:1,resetAt}).onDuplicateKeyUpdate({set:{attempts:sql`IF(${authAttempts.resetAt} <= ${now}, 1, ${authAttempts.attempts}+1)`,resetAt:sql`IF(${authAttempts.resetAt} <= ${now}, ${resetAt}, ${authAttempts.resetAt})`}});const [row]=await db.select().from(authAttempts).where(eq(authAttempts.id,id)).limit(1);if(row.attempts>maximum)fail('Too many attempts. Please try again in 15 minutes.',429);}
export async function authenticate(input:Record<string,unknown>,mode:'login'|'register'){
 const email=String(input.email||'').trim().toLowerCase(),password=String(input.password||''),name=String(input.name||'').trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<8||password.length>128)fail('Enter a valid email and a password between 8 and 128 characters.');
 await limit('login:'+email,15);await limit('global:'+mode,mode==='register'?100:1000);
 const db=getDb();let [user]=await db.select().from(users).where(eq(users.email,email)).limit(1);
 if(mode==='register'){
  if(name.length<2||name.length>80)fail('Enter a name between 2 and 80 characters.');if(user)fail('That email is already registered. Sign in instead.',409);
  const passwordHash=await hashPassword(password);
  const record={id:crypto.randomUUID(),email,name,passwordHash,createdAt:Date.now()};
  try{await db.insert(users).values(record);}catch(error){if((error as {code?:string}).code==='ER_DUP_ENTRY'||(error as {cause?:{code?:string}}).cause?.code==='ER_DUP_ENTRY')fail('That email is already registered. Sign in instead.',409);throw error;}user=record;
 }else{
  const valid=await verifyPassword(password,user?.passwordHash||DUMMY_PASSWORD_HASH);if(!user||!valid)fail('Email or password is incorrect.',401);
 }
 const token=randomBytes(32).toString('hex'),now=Date.now();await db.insert(sessions).values({id:hashToken(token),userId:user.id,createdAt:now,expiresAt:now+7*86400000});await db.delete(authAttempts).where(eq(authAttempts.id,hashToken('login:'+email)));
 return {token,user:{name:user.name,email:user.email}};
}
export function cookieOptions(){const configured=process.env.APP_URL;const local=configured&&['localhost','127.0.0.1','::1'].includes(new URL(configured).hostname);return {httpOnly:true,sameSite:'lax' as const,secure:configured?new URL(configured).protocol==='https:':process.env.NODE_ENV==='production',path:'/',maxAge:7*86400,...(!local&&process.env.NODE_ENV==='production'?{secure:true}:{})};}
export async function signOut(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(token)await getDb().delete(sessions).where(eq(sessions.id,hashToken(token)));}
