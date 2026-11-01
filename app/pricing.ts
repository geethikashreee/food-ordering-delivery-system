import { rescueDeals } from './foodly';
import { restaurants } from './catalog';
export function priceCart(restaurantId:string, input: {id:string;quantity:number}[], coupon:string='', rescueId?:string|null) {
  const restaurant=restaurants.find(r=>r.id===restaurantId);
  if(!restaurant || !Array.isArray(input) || input.length<1 || input.length>30) throw new Error('Choose a restaurant and add items to your bag.');
  const rescue=rescueId?rescueDeals.find(d=>d.id===rescueId&&d.restaurantId===restaurantId):null;
  if(rescueId&&!rescue)throw new Error('That rescue offer is not valid.');
  if(rescue&&coupon.trim())throw new Error('Rescue prices already include a discount. Remove the coupon to continue.');
  const seen=new Set<string>();
  const items=input.map(i=>{
    const d=restaurant.dishes.find(d=>d.id===i?.id);
    if(!d || !Number.isInteger(i.quantity) || i.quantity<1 || i.quantity>20 || seen.has(i.id)) throw new Error('Your bag contains an invalid item or quantity.');
    if(rescue&&d.id!==rescue.dishId)throw new Error('A rescue bag can contain only its surplus dish.');
    seen.add(i.id);return {...d,price:rescue?rescue.price:d.price,quantity:i.quantity};
  });
  const subtotal=items.reduce((a,i)=>a+i.price*i.quantity,0);
  const code=coupon.trim().toUpperCase();let discount=0;
  if((code==='FOODLY50'||code==='CRAVE50')) {if(subtotal<199) throw new Error('Add ₹'+(199-subtotal)+' more to use FOODLY50.');discount=Math.min(Math.round(subtotal*.5),120);}
  else if(code==='WELCOME100') {if(subtotal<499) throw new Error('WELCOME100 needs an item total of ₹499.');discount=100;}
  else if(code) throw new Error('That coupon is not valid. Try FOODLY50 or WELCOME100.');
  const delivery=subtotal>=499?0:35;
  const tax=Math.round((subtotal-discount)*.05);
  return {restaurant,items,subtotal,discount,delivery,tax,total:subtotal-discount+delivery+tax,coupon:code||null};
}
