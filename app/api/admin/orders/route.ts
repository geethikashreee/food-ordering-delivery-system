import {and,desc,eq,gte,like,lt,or,sql,type SQL} from 'drizzle-orm';
import {getCurrentUser} from '../../../auth';
import {getDb} from '../../../../db';
import {orders,profiles,users} from '../../../../db/schema';
import {isAdminEmail} from '../../../../lib/admin-access';
import {parseOrderFilters} from '../../../../lib/order-report';
import {errorResponse,fail} from '../../../../lib/http';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){try{
  const user=await getCurrentUser();
  if(!user)fail('Please sign in to view order history.',401);
  if(!isAdminEmail(user.email))fail('Administrator access is required.',403);
  const filter=parseOrderFilters(new URL(request.url).searchParams),conditions:SQL[]=[];
  if(filter.status)conditions.push(eq(orders.status,filter.status));
  if(filter.restaurant)conditions.push(eq(orders.restaurantId,filter.restaurant));
  if(filter.from!==undefined)conditions.push(gte(orders.createdAt,filter.from));
  if(filter.to!==undefined)conditions.push(lt(orders.createdAt,filter.to));
  if(filter.search){const value='%'+filter.search+'%';conditions.push(or(like(orders.id,value),like(users.name,value),like(users.email,value),like(profiles.name,value),like(orders.restaurantName,value),like(orders.phone,value))!);}
  const where=and(...conditions),db=getDb();
  const [rows,totals]=await Promise.all([
    db.select({id:orders.id,customerId:orders.userId,customerName:sql<string>`COALESCE(NULLIF(${profiles.name}, ''), ${users.name}, 'Unknown customer')`,customerEmail:users.email,restaurantId:orders.restaurantId,restaurantName:orders.restaurantName,createdAt:orders.createdAt,updatedAt:orders.updatedAt,status:orders.status,items:orders.items,events:orders.events,subtotal:orders.subtotal,discount:orders.discount,delivery:orders.delivery,tax:orders.tax,total:orders.total,coupon:orders.coupon,address:orders.address,phone:orders.phone,note:orders.note,payment:orders.payment,schedule:orders.schedule}).from(orders).leftJoin(users,eq(orders.userId,users.id)).leftJoin(profiles,eq(orders.userId,profiles.userId)).where(where).orderBy(desc(orders.createdAt),desc(orders.id)).limit(filter.pageSize).offset((filter.page-1)*filter.pageSize),
    db.select({total:sql<number>`COUNT(*)`,delivered:sql<number>`COALESCE(SUM(${orders.status} = 'Delivered'), 0)`,active:sql<number>`COALESCE(SUM(${orders.status} IN ('Placed', 'Preparing', 'Out for delivery')), 0)`,deliveredValue:sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'Delivered' THEN ${orders.total} ELSE 0 END), 0)`}).from(orders).leftJoin(users,eq(orders.userId,users.id)).leftJoin(profiles,eq(orders.userId,profiles.userId)).where(where),
  ]);
  const summary=totals[0];
  return Response.json({orders:rows.map(order=>({...order,items:JSON.parse(order.items),events:JSON.parse(order.events)})),page:filter.page,pageSize:filter.pageSize,total:Number(summary.total),summary:{delivered:Number(summary.delivered),active:Number(summary.active),deliveredValue:Number(summary.deliveredValue)}},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
}catch(error){return errorResponse(error);}}
