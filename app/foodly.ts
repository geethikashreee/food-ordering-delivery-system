import { restaurants, type Dish } from './catalog';
export const tools = [
 {id:'mood',name:'Food Mood AI',icon:'sparkles',tag:'Personal recommendations',description:'Find menu options based on your mood, diet and budget.'},
 {id:'squad',name:'Foodly Squad',icon:'users',tag:'Group ordering',description:'Coordinate everyone’s choices and place one group order.'},
 {id:'rescue',name:'Food Waste Rescue',icon:'recycle',tag:'Surplus food offers',description:'Browse available surplus meals at discounted prices.'},
 {id:'queue',name:'Smart Queue',icon:'clock',tag:'Preparation estimates',description:'Estimate preparation and delivery time using kitchen workload.'},
 {id:'plate',name:'Smart Plate',icon:'salad',tag:'Dietary filters',description:'Filter individual dishes by dietary preference and price.'},
 {id:'streaks',name:'Foodly Streaks',icon:'trophy',tag:'Points and rewards',description:'Earn points on eligible delivered orders and build your streak.'},
 {id:'pulse',name:'Delivery Pulse',icon:'bike',tag:'Order tracking',description:'Follow saved order stages from placement through delivery.'},
 {id:'lab',name:'Intelligence Lab',icon:'chart',tag:'Ordering insights',description:'Review your ordering activity and compare menu performance.'},
] as const;
export type ToolId=typeof tools[number]['id'];
export const moods=[{id:'comfort',name:'Comfort me',icon:'coffee',cuisines:['North Indian','Biryani','South Indian']},{id:'adventure',name:'Feeling adventurous',icon:'flame',cuisines:['Chinese','Asian','Italian']},{id:'fresh',name:'Keep it fresh',icon:'leaf',cuisines:['Healthy','Salads']},{id:'celebrate',name:'Time to celebrate',icon:'party',cuisines:['Pizza','Desserts','Burgers']},{id:'quick',name:'In a hurry',icon:'zap',cuisines:['Breakfast','Burgers','South Indian']}] as const;
export type Diet='all'|'vegetarian'|'plant-based'|'non-vegetarian';
const plantBased=new Set(['gf1','gf2','gf3','dd3','dd4','ww3']);
export const dietaryTags=(d:Dish)=>[d.veg?'Vegetarian':'Non-vegetarian',...(plantBased.has(d.id)?['Plant-based']:[])];
export function matchesDiet(d:Dish,diet:string){return diet==='vegetarian'?d.veg:diet==='plant-based'?plantBased.has(d.id):diet==='non-vegetarian'?!d.veg:true;}
export const dishes=restaurants.flatMap(r=>r.dishes.map(d=>({...d,restaurantId:r.id,restaurantName:r.name,cuisines:r.cuisines,rating:r.rating,time:r.time})));
export function recommend(mood:string,budget:number,diet:string,cuisine='All'){
 const rule=moods.find(m=>m.id===mood)||moods[0];
 return dishes.filter(d=>d.price<=budget&&matchesDiet(d,diet)&&(cuisine==='All'||d.cuisines.includes(cuisine))).map(d=>{
 const match=d.cuisines.some(c=>(rule.cuisines as readonly string[]).includes(c));
 const speed=rule.id==='quick'?(40-d.time):0;
 return {...d,score:(match?50:0)+(d.popular?8:0)+d.rating*3+speed,reason:match?`${d.cuisines.find(c=>(rule.cuisines as readonly string[]).includes(c))} matches your ${rule.name.toLowerCase()} mood.`:`A ${diet==='all'?'menu':diet} option within your budget.`,budgetLeft:budget-d.price};
 }).sort((a,b)=>b.score-a.score||a.price-b.price).slice(0,6);
}
export const rescueDeals=[{id:'rescue-biryani',restaurantId:'biryani-house',dishId:'bh4',price:129,stock:6},{id:'rescue-bowl',restaurantId:'green-fork',dishId:'gf3',price:149,stock:5},{id:'rescue-brownie',restaurantId:'sweet-spot',dishId:'ss2',price:79,stock:8},{id:'rescue-dosa',restaurantId:'dosa-days',dishId:'dd3',price:59,stock:7}];
export function indiaDay(time=Date.now()){return new Date(time+330*60000).toISOString().slice(0,10);}
export function rescueWindow(time=Date.now()){const day=indiaDay(time);return {day,expiresAt:Date.parse(day+'T23:30:00+05:30')};}
export function queueEstimate(restaurantId:string,quantity=1,distinct=1,workload=0){
 const r=restaurants.find(r=>r.id===restaurantId);if(!r)throw Error('Choose a restaurant.');
 const kitchenMinutes=Math.max(8,r.time-12)+Math.max(0,distinct-1)*2+Math.max(0,Math.ceil(quantity/2)-1)*3;
 const queueMinutes=Math.min(60,Math.ceil(workload/4)*4),travelMinutes=10+Math.ceil(Number(r.distance)*2);
 return {restaurantId,restaurantName:r.name,workload,kitchenMinutes,queueMinutes,preparationMinutes:kitchenMinutes+queueMinutes,travelMinutes,totalMinutes:kitchenMinutes+queueMinutes+travelMinutes};
}
export type RewardOrder={subtotal:number;discount:number;updatedAt:number;rescueDealId?:string|null};
export function rewardSummary(delivered:RewardOrder[],now=Date.now()){
 const eligible=delivered.filter(o=>o.subtotal-o.discount>=149);
 const points=eligible.reduce((sum,o)=>sum+Math.floor((o.subtotal-o.discount)/10),0);
 const days=[...new Set(eligible.map(o=>indiaDay(o.updatedAt)))].sort();
 let best=0,run=0,previous='';for(const day of days){run=previous&&Date.parse(day)-Date.parse(previous)===86400000?run+1:1;best=Math.max(best,run);previous=day;}
 let streak=0;let cursor=indiaDay(now);const set=new Set(days);if(!set.has(cursor))cursor=indiaDay(now-86400000);while(set.has(cursor)){streak++;cursor=indiaDay(Date.parse(cursor+'T12:00:00+05:30')-86400000);}
 const level=points>=300?'Gold':points>=100?'Silver':'Bronze';
 return {points,streak,best,eligibleOrders:eligible.length,level,nextLevel:points>=300?null:points>=100?300:100,rescued:delivered.filter(o=>o.rescueDealId).length,week:Array.from({length:7},(_,i)=>{const day=indiaDay(now-(6-i)*86400000);return {day,earned:set.has(day)};})};
}
export type QueueInfo=ReturnType<typeof queueEstimate>;
export type Rewards=ReturnType<typeof rewardSummary>;
export type RescueOffer=typeof rescueDeals[number]&{key:string;remaining:number;expiresAt:number};
export type SquadMember={id:string;name:string;userId:string|null;picks:{id:string;quantity:number}[];ready:boolean};
export type Squad={id:string;code:string;title:string;restaurantId:string;budget:number;owner:boolean;state:string;members:SquadMember[];myMemberId:string|null;orderId:string|null};
