'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ChevronLeft,ChevronRight,Download,PackageCheck,RefreshCw,Search,ShieldCheck,ShoppingBag,Utensils,X} from 'lucide-react';
import {restaurants} from './catalog';
import {csvCell,type AdminOrder,type AdminOrderResponse} from '../lib/order-report';

const money=(value:number)=>'₹'+value.toLocaleString('en-IN');
const time=(value:number)=>new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const emptyFilters={search:'',status:'',restaurant:'',from:'',to:''};

function OrderDetails({order,onClose}:{order:AdminOrder;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  return <dialog ref={dialog} className="admin-order-dialog" aria-labelledby="admin-order-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="admin-detail-heading"><div><span className="overline">ORDER DETAILS</span><h2 id="admin-order-title">{order.restaurantName}</h2><small>#{order.id}</small></div><button className="icon-button" onClick={onClose} aria-label="Close order details"><X size={20}/></button></div>
    <div className="admin-detail-body"><dl className="admin-detail-grid"><div><dt>Customer</dt><dd>{order.customerName}</dd></div><div><dt>Email</dt><dd>{order.customerEmail||'Unavailable'}</dd></div><div><dt>Placed on (IST)</dt><dd>{time(order.createdAt)}</dd></div><div><dt>Last updated (IST)</dt><dd>{time(order.updatedAt)}</dd></div><div><dt>Status</dt><dd>{order.status}</dd></div><div><dt>Mobile number</dt><dd>{order.phone}</dd></div><div className="wide"><dt>Delivery address</dt><dd>{order.address}</dd></div><div><dt>Payment method</dt><dd>{order.payment}</dd></div><div><dt>Delivery preference</dt><dd>{order.schedule==='ASAP'?'As soon as possible':new Date(order.schedule).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST'}</dd></div>{order.note&&<div className="wide"><dt>Delivery instructions</dt><dd>{order.note}</dd></div>}</dl>
      <h3 className="admin-detail-subtitle">Ordered items</h3><div className="admin-table-scroll"><table className="admin-items-table"><thead><tr><th>Dish</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{order.items.map((item,index)=><tr key={item.id+'-'+index}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.quantity*item.price)}</td></tr>)}</tbody></table></div>
      <dl className="admin-detail-bill"><div><dt>Item subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Discount{order.coupon?' · '+order.coupon:''}</dt><dd>−{money(order.discount)}</dd></div><div><dt>Delivery fee</dt><dd>{money(order.delivery)}</dd></div><div><dt>Tax</dt><dd>{money(order.tax)}</dd></div><div className="grand-total"><dt>Order total</dt><dd>{money(order.total)}</dd></div></dl>
      <h3 className="admin-detail-subtitle">Status history</h3><ol className="admin-order-events">{order.events.map((event,index)=><li key={index}><b>{event.status}</b><time>{time(event.at)} IST</time></li>)}</ol>
    </div>
  </dialog>;
}

export default function AdminOrders({name}:{name:string}){
  const [filters,setFilters]=useState(emptyFilters),[page,setPage]=useState(1),[data,setData]=useState<AdminOrderResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[version,setVersion]=useState(0),[selected,setSelected]=useState<AdminOrder|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);setError('');
      try{
        const params=new URLSearchParams({page:String(page),...filters});
        const response=await fetch('/api/admin/orders?'+params,{cache:'no-store',signal:controller.signal});
        const result=await response.json();
        if(!response.ok)throw Error(result.error||'Unable to load order history.');
        setData(result);
      }catch(reason){if(controller.signal.aborted)return;setError(reason instanceof Error?reason.message:'Unable to connect. Please try again.');setData(null);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[filters,page,version]);
  function change(key:keyof typeof emptyFilters,value:string){setFilters(previous=>({...previous,[key]:value}));setPage(1);}
  function exportPage(){
    if(!data?.orders.length)return;
    const rows=[['Order ID','Customer','Email','Restaurant','Placed on (IST)','Status','Subtotal (INR)','Discount (INR)','Delivery (INR)','Tax (INR)','Total (INR)','Mobile number','Delivery address'],...data.orders.map(order=>[order.id,order.customerName,order.customerEmail,order.restaurantName,time(order.createdAt),order.status,order.subtotal,order.discount,order.delivery,order.tax,order.total,order.phone,order.address])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='foodly-orders-page-'+page+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const total=data?.total||0,pages=Math.max(1,Math.ceil(total/(data?.pageSize||25)));
  return <div className="admin-page">
    <header className="admin-header"><div className="wrap"><Link href="/" className="brand" aria-label="Foodly home"><span className="brand-mark"><Utensils size={24}/></span>foodly<span className="brand-dot">.</span></Link><span className="admin-badge"><ShieldCheck size={15}/>Administrator</span><div className="admin-header-links"><Link href="/features">Foodly Hub</Link><span>{name}</span></div></div></header>
    <main className="wrap admin-main"><Link className="text-button admin-back" href="/features"><ArrowLeft size={14}/>Foodly Hub</Link>
      <div className="admin-page-heading"><div><span className="overline">ADMINISTRATION / ORDERS</span><h1>Order history</h1><p>Review customer orders across restaurants. All order times are shown in India Standard Time.</p></div><div className="admin-actions"><button className="secondary" disabled={loading} onClick={()=>setVersion(value=>value+1)}><RefreshCw size={15}/>Refresh</button><button className="primary" disabled={loading||!data?.orders.length} onClick={exportPage}><Download size={15}/>Export page</button></div></div>
      <div className="admin-summary"><article><span><ShoppingBag size={18}/>Matching orders</span><strong>{data?total:'—'}</strong></article><article><span><PackageCheck size={18}/>Delivered</span><strong>{data?data.summary.delivered:'—'}</strong></article><article><span><RefreshCw size={18}/>Active orders</span><strong>{data?data.summary.active:'—'}</strong></article><article><span><ShoppingBag size={18}/>Delivered order value</span><strong>{data?money(data.summary.deliveredValue):'—'}</strong></article></div>
      <section className="admin-order-panel" aria-labelledby="all-orders-title"><div className="admin-panel-heading"><div><h2 id="all-orders-title">Customer orders</h2><p>Search by customer, email, order ID, phone or restaurant.</p></div><span className="admin-restricted"><ShieldCheck size={13}/>Admin access only</span></div>
        <div className="admin-filters"><label className="admin-search-label">Search<div className="admin-search"><Search size={16}/><input type="search" value={filters.search} maxLength={100} onChange={event=>change('search',event.target.value)} placeholder="Customer, email, order or restaurant"/></div></label><label>Status<select value={filters.status} onChange={event=>change('status',event.target.value)}><option value="">All statuses</option>{['Placed','Preparing','Out for delivery','Delivered','Cancelled'].map(status=><option key={status}>{status}</option>)}</select></label><label>Restaurant<select value={filters.restaurant} onChange={event=>change('restaurant',event.target.value)}><option value="">All restaurants</option>{restaurants.map(restaurant=><option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label><label>From (IST)<input type="date" value={filters.from} max={filters.to||undefined} onChange={event=>change('from',event.target.value)}/></label><label>To (IST)<input type="date" value={filters.to} min={filters.from||undefined} onChange={event=>change('to',event.target.value)}/></label></div>
        {Object.values(filters).some(Boolean)&&<button className="text-button admin-clear" onClick={()=>{setFilters(emptyFilters);setPage(1);}}>Clear filters</button>}
        {error&&<div className="admin-error" role="alert">{error}<button onClick={()=>setVersion(value=>value+1)}>Retry</button></div>}
        <div className={'admin-table-scroll '+(loading?'is-loading':'')} aria-busy={loading}>
          <table className="admin-orders-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Restaurant</th><th>Placed on (IST)</th><th>Status</th><th>Total</th><th><span className="sr-only">Order details</span></th></tr></thead><tbody>{data?.orders.map(order=><tr key={order.id}><td><b title={order.id}>#{order.id.slice(0,8).toUpperCase()}</b></td><td><b>{order.customerName}</b><small>{order.customerEmail||'Email unavailable'}</small></td><td>{order.restaurantName}</td><td>{time(order.createdAt)}</td><td><span className={'status status-'+order.status.split(' ')[0]}>{order.status}</span></td><td><b>{money(order.total)}</b></td><td><button className="text-button" onClick={()=>setSelected(order)} aria-label={'Details for order '+order.id.slice(0,8)}>Details<ChevronRight size={13}/></button></td></tr>)}</tbody></table>
          {!data?.orders.length&&!error&&<div className="admin-empty"><ShoppingBag size={27}/><h3>{loading?'Loading orders…':'No matching orders'}</h3><p>{loading?'Retrieving saved order history.':'Orders appear here after a customer completes checkout.'}</p></div>}
        </div>
        <div className="admin-pagination"><span>{loading?'Updating results…':total?`${(page-1)*(data?.pageSize||25)+1}–${Math.min(page*(data?.pageSize||25),total)} of ${total} orders`:'0 orders'}</span><div><button className="secondary small" disabled={loading||page<=1} onClick={()=>setPage(value=>value-1)}><ChevronLeft size={14}/>Previous</button><span>Page {page} of {pages}</span><button className="secondary small" disabled={loading||page>=pages} onClick={()=>setPage(value=>value+1)}>Next<ChevronRight size={14}/></button></div></div>
      </section>
      <p className="admin-footnote">This page is restricted to configured administrators. Customer accounts can access only their own order history.</p>
    </main>
    {selected&&<OrderDetails order={selected} onClose={()=>setSelected(null)}/>}
  </div>;
}
