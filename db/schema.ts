import {mysqlTable,varchar,text,int,bigint,uniqueIndex,index} from 'drizzle-orm/mysql-core';
const stamp=(name:string)=>bigint(name,{mode:'number'});
export const users=mysqlTable('users',{
 id:varchar('id',{length:36}).primaryKey(),email:varchar('email',{length:254}).notNull().unique(),name:varchar('name',{length:80}).notNull(),passwordHash:varchar('password_hash',{length:255}).notNull(),createdAt:stamp('created_at').notNull(),
});
export const sessions=mysqlTable('sessions',{
 id:varchar('id',{length:64}).primaryKey(),userId:varchar('user_id',{length:36}).notNull().references(()=>users.id,{onDelete:'cascade'}),expiresAt:stamp('expires_at').notNull(),createdAt:stamp('created_at').notNull(),
},t=>[index('sessions_expiry').on(t.expiresAt)]);
export const authAttempts=mysqlTable('auth_attempts',{
 id:varchar('id',{length:64}).primaryKey(),attempts:int('attempts').notNull(),resetAt:stamp('reset_at').notNull(),
});
export const orders=mysqlTable('orders',{
 id:varchar('id',{length:36}).primaryKey(),userId:varchar('user_id',{length:36}).notNull(),requestKey:varchar('request_key',{length:80}).notNull(),
 restaurantId:varchar('restaurant_id',{length:80}).notNull(),restaurantName:varchar('restaurant_name',{length:120}).notNull(),
 items:text('items').notNull(),subtotal:int('subtotal').notNull(),discount:int('discount').notNull(),delivery:int('delivery').notNull(),tax:int('tax').notNull(),total:int('total').notNull(),
 coupon:varchar('coupon',{length:30}),address:varchar('address',{length:500}).notNull(),phone:varchar('phone',{length:20}).notNull(),
 note:varchar('note',{length:300}).notNull().default(''),schedule:varchar('schedule',{length:40}).notNull().default('ASAP'),
 payment:varchar('payment',{length:40}).notNull().default('Cash on delivery'),status:varchar('status',{length:30}).notNull().default('Placed'),
 events:text('events').notNull(),preparationMinutes:int('preparation_minutes').notNull().default(0),queueMinutes:int('queue_minutes').notNull().default(0),
 rescueDealId:varchar('rescue_deal_id',{length:80}),rescueKey:varchar('rescue_key',{length:120}),squadId:varchar('squad_id',{length:36}),createdAt:stamp('created_at').notNull(),updatedAt:stamp('updated_at').notNull(),
},t=>[uniqueIndex('orders_request_key').on(t.userId,t.requestKey),uniqueIndex('orders_squad_unique').on(t.squadId),index('orders_user_created').on(t.userId,t.createdAt),index('orders_workload').on(t.restaurantId,t.status)]);
export const profiles=mysqlTable('profiles',{
 userId:varchar('user_id',{length:36}).primaryKey(),name:varchar('name',{length:80}).notNull().default(''),address:varchar('address',{length:500}).notNull().default(''),phone:varchar('phone',{length:20}).notNull().default(''),favourites:text('favourites').notNull(),
});
export const rescueInventory=mysqlTable('rescue_inventory',{
 id:varchar('id',{length:120}).primaryKey(),dealId:varchar('deal_id',{length:80}).notNull(),remaining:int('remaining').notNull(),expiresAt:stamp('expires_at').notNull(),
});
export const squads=mysqlTable('squads',{
 id:varchar('id',{length:36}).primaryKey(),code:varchar('code',{length:8}).notNull().unique(),ownerId:varchar('owner_id',{length:36}).notNull(),title:varchar('title',{length:70}).notNull(),restaurantId:varchar('restaurant_id',{length:80}).notNull(),budget:int('budget').notNull(),state:varchar('state',{length:20}).notNull().default('open'),orderId:varchar('order_id',{length:36}),revision:int('revision').notNull().default(0),createdAt:stamp('created_at').notNull(),updatedAt:stamp('updated_at').notNull(),
},t=>[index('squads_owner_created').on(t.ownerId,t.createdAt)]);
export const squadMembers=mysqlTable('squad_members',{
 id:varchar('id',{length:36}).primaryKey(),squadId:varchar('squad_id',{length:36}).notNull().references(()=>squads.id,{onDelete:'cascade'}),userId:varchar('user_id',{length:36}),name:varchar('name',{length:50}).notNull(),picks:text('picks').notNull(),ready:int('ready').notNull().default(0),
},t=>[uniqueIndex('squad_user_unique').on(t.squadId,t.userId)]);
