'use client';

import Link from 'next/link';
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {ArrowRight,ChevronRight,Clock3,Heart,LayoutDashboard,PackageCheck,ShoppingBag} from 'lucide-react';
import FeatureHub,{type FeatureHubProps} from './feature-hub';
import {FoodlyIcon} from './foodly-icons';
import {tools,type ToolId} from './foodly';
import {featureFromSlug,featureSlugs} from './feature-routes';

type View=ToolId|'overview';
type Props=Omit<FeatureHubProps,'tool'|'onRoute'|'embedded'>&{favouriteCount:number;isAdmin?:boolean;onOrders:()=>void};
const views:View[]=['overview',...tools.map(tool=>tool.id)];
const money=(value:number)=>'₹'+value.toLocaleString('en-IN');
const orderedAt=(value:number)=>new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});

export default function FeatureDashboard(props:Props){
  const [view,setView]=useState<View>('overview');
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  useEffect(()=>{
    const readLocation=()=>{
      let hash='';
      try{hash=decodeURIComponent(window.location.hash.slice(1));}catch{}
      setView(featureFromSlug(hash)||'overview');
    };
    readLocation();
    window.addEventListener('hashchange',readLocation);
    window.addEventListener('popstate',readLocation);
    return()=>{window.removeEventListener('hashchange',readLocation);window.removeEventListener('popstate',readLocation);};
  },[]);
  function select(next:View){
    setView(next);
    const hash=next==='overview'?'':('#'+featureSlugs[next]);
    if(window.location.hash!==hash)window.history.pushState(null,'',window.location.pathname+window.location.search+hash);
  }
  function keyNavigation(event:KeyboardEvent<HTMLButtonElement>,index:number){
    const offset=['ArrowRight','ArrowDown'].includes(event.key)?1:['ArrowLeft','ArrowUp'].includes(event.key)?-1:0;
    if(!offset&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?views.length-1:(index+offset+views.length)%views.length;
    select(views[next]);tabs.current[next]?.focus();
  }
  const delivered=props.orders.filter(order=>order.status==='Delivered');
  const active=props.orders.filter(order=>!['Delivered','Cancelled'].includes(order.status));
  const metrics=[
    {label:'Active orders',value:active.length,icon:Clock3},
    {label:'Delivered orders',value:delivered.length,icon:PackageCheck},
    {label:'Delivered order value',value:money(delivered.reduce((sum,order)=>sum+order.total,0)),icon:ShoppingBag},
    {label:'Saved restaurants',value:props.favouriteCount,icon:Heart},
  ];
  return <div className="dashboard-page">
    <div className="wrap">
      <div className="dashboard-heading">
        <div><span className="overline">FOODLY / FEATURES</span><h1>Foodly Hub</h1><p>Plan meals, coordinate group orders and manage your activity in one place.</p></div>
        <div className="dashboard-heading-actions"><button className="secondary" onClick={props.onOrders}><ShoppingBag size={16}/>My orders</button>{props.isAdmin&&<Link href="/admin/orders" className="primary"><ShoppingBag size={16}/>Admin orders<ArrowRight size={15}/></Link>}</div>
      </div>
      <div className="dashboard-metrics">{metrics.map(({label,value,icon:Icon})=><article key={label}><span className="dashboard-metric-icon"><Icon size={19}/></span><div><span>{label}</span><strong>{props.user?value:'—'}</strong></div></article>)}</div>
      {!props.user&&<div className="dashboard-account-note"><span>Sign in to see your orders, saved restaurants and rewards.</span><button className="text-button" onClick={props.onSignIn}>Sign in<ArrowRight size={14}/></button></div>}
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <span className="dashboard-nav-label">WORKSPACE</span>
          <nav role="tablist" aria-label="Foodly Hub tools" aria-orientation="vertical">{views.map((id,index)=>{
            const tool=tools.find(item=>item.id===id);
            return <button key={id} ref={node=>{tabs.current[index]=node;}} id={'dashboard-tab-'+id} type="button" role="tab" aria-selected={view===id} aria-controls="dashboard-workspace" tabIndex={view===id?0:-1} className={view===id?'selected':''} onClick={()=>select(id)} onKeyDown={event=>keyNavigation(event,index)}>{tool?<FoodlyIcon name={tool.icon} size={18}/>:<LayoutDashboard size={18}/>}<span>{tool?.name||'Overview'}</span><ChevronRight size={13}/></button>;
          })}</nav>
          <div className="dashboard-sidebar-footer"><span>Ready to order?</span><button className="text-button" onClick={props.onBack}>Browse restaurants<ArrowRight size={14}/></button></div>
        </aside>
        <section className="dashboard-workspace" id="dashboard-workspace" role="tabpanel" aria-labelledby={'dashboard-tab-'+view} tabIndex={0}>
          {view==='overview'?<>
            <div className="dashboard-section-heading"><span className="overline">EIGHT TOOLS. ONE WORKSPACE.</span><h2>Order with more control.</h2><p>Choose a tool to get started. Your cart and account stay together as you switch.</p></div>
            <div className="dashboard-tools">{tools.map(tool=><button key={tool.id} className="dashboard-tool-card" onClick={()=>select(tool.id)}><span className={'dashboard-tool-icon '+tool.id}><FoodlyIcon name={tool.icon} size={23}/></span><span className="dashboard-tool-copy"><b>{tool.name}</b><small>{tool.description}</small><span>Open tool<ArrowRight size={13}/></span></span></button>)}</div>
            <section className="dashboard-recent"><div className="dashboard-recent-heading"><div><span className="overline">YOUR ACTIVITY</span><h2>Recent orders</h2></div><button className="text-button" onClick={props.onOrders}>View all<ArrowRight size={14}/></button></div>
              {props.orders.length?<div className="dashboard-table-scroll"><table><thead><tr><th>Restaurant</th><th>Ordered on (IST)</th><th>Status</th><th>Total</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{props.orders.slice(0,5).map(order=><tr key={order.id}><td><b>{order.restaurantName}</b><small>#{order.id.slice(0,8).toUpperCase()}</small></td><td>{orderedAt(order.createdAt)}</td><td><span className={'status status-'+order.status.split(' ')[0]}>{order.status}</span></td><td>{money(order.total)}</td><td><button className="text-button" onClick={()=>props.onTrack(order)} aria-label={'View order '+order.id.slice(0,8)}>Details<ChevronRight size={13}/></button></td></tr>)}</tbody></table></div>:<div className="dashboard-empty"><ShoppingBag size={24}/><h3>{props.user?'Your orders will appear here':'Keep track of every order'}</h3><p>{props.user?'Place an order to see its restaurant, time, status and total.':'Sign in to view your order history and delivery updates.'}</p><button className="text-button" onClick={props.user?props.onBack:props.onSignIn}>{props.user?'Browse restaurants':'Sign in'}<ArrowRight size={14}/></button></div>}
            </section>
          </>:<FeatureHub {...props} tool={view} onRoute={select} embedded/>}
        </section>
      </div>
    </div>
  </div>;
}
