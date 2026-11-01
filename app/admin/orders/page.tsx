import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getCurrentUser} from '../../auth';
import {isAdminEmail} from '../../../lib/admin-access';
import AdminOrders from '../../admin-orders';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata:Metadata={title:'Admin order history | Foodly',robots:{index:false,follow:false}};
export default async function AdminOrderPage(){
  const user=await getCurrentUser();
  if(!user)redirect('/sign-in?returnTo=%2Fadmin%2Forders');
  if(!isAdminEmail(user.email))return <main className="admin-access-denied"><h1>Administrator access required</h1><p>This account cannot view other customers’ order history.</p><Link href="/features" className="primary">Return to Foodly Hub</Link></main>;
  return <AdminOrders name={user.displayName}/>;
}
