import {fail} from './http';

export type AdminOrder={
  id:string;customerId:string;customerName:string;customerEmail:string|null;
  restaurantId:string;restaurantName:string;createdAt:number;updatedAt:number;status:string;
  items:{id:string;name:string;quantity:number;price:number}[];
  events:{status:string;at:number}[];
  subtotal:number;discount:number;delivery:number;tax:number;total:number;coupon:string|null;
  address:string;phone:string;note:string;payment:string;schedule:string;
};
export type AdminOrderResponse={orders:AdminOrder[];page:number;pageSize:number;total:number;summary:{delivered:number;active:number;deliveredValue:number}};
const statuses=['Placed','Preparing','Out for delivery','Delivered','Cancelled'];
export function parseOrderFilters(params:URLSearchParams){
  const page=Number(params.get('page')||1);
  if(!Number.isInteger(page)||page<1||page>100000)fail('Choose a valid results page.');
  const search=(params.get('search')||'').trim();
  if(search.length>100)fail('Keep your search under 100 characters.');
  const status=params.get('status')||'';
  if(status&&!statuses.includes(status))fail('Choose a valid order status.');
  const restaurant=params.get('restaurant')||'';
  if(restaurant.length>80)fail('Choose a valid restaurant.');
  function dateStart(value:string|null){
    if(!value)return undefined;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('Use a valid date in YYYY-MM-DD format.');
    const time=Date.parse(value+'T00:00:00+05:30');
    if(!Number.isFinite(time)||new Date(time+330*60000).toISOString().slice(0,10)!==value)fail('Choose a valid calendar date.');
    return time;
  }
  const from=dateStart(params.get('from')),lastDay=dateStart(params.get('to'));
  if(from!==undefined&&lastDay!==undefined&&from>lastDay)fail('The start date must be on or before the end date.');
  return {page,pageSize:25,search,status,restaurant,from,to:lastDay===undefined?undefined:lastDay+86400000};
}
export function csvCell(value:unknown){
  let text=String(value??'');
  if(/^[=+@\-\t\r]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
