export const photo = (id: string, _width = 700) => `/food/${id}.jpg`;
export type Dish = { id: string; name: string; description: string; price: number; veg: boolean; image: string; popular?: boolean };
export type Restaurant = { id: string; name: string; cuisines: string[]; rating: number; time: number; distance: string; cost: number; image: string; offer: string; tag: string; veg: boolean; dishes: Dish[] };
const pics = {
  biryani: 'photo-1559528896-c5310744cce8', burger: 'photo-1568901346375-23c9450c58cd',
  pizza: 'photo-1513104890138-7c749659a591', bowl: 'photo-1546069901-ba9599a7e63c',
  curry: 'photo-1603894584373-5ac82b2ae398', noodles: 'photo-1569718212165-3a8278d5f624',
  dessert: 'photo-1578985545062-69928b1d9587', dosa: 'photo-1630383249896-424e482df921',
};
const dish = (id: string, name: string, description: string, price: number, veg: boolean, image: keyof typeof pics, popular = false): Dish => ({id,name,description,price,veg,image:photo(pics[image],400),popular});
export const restaurants: Restaurant[] = [
  {id:'biryani-house',name:'The Biryani House',cuisines:['Biryani','North Indian'],rating:4.6,time:25,distance:'1.2',cost:350,image:photo(pics.biryani),offer:'50% OFF up to ₹120',tag:'Crowd favourite',veg:false,dishes:[
    dish('bh1','Hyderabadi Chicken Biryani','Slow-cooked basmati, tender chicken, saffron & our signature raita.',299,false,'biryani',true),
    dish('bh2','Paneer Dum Biryani','Fragrant rice layered with spiced paneer and caramelised onions.',249,true,'biryani'),
    dish('bh3','Butter Chicken Bowl','Rich tomato gravy, tandoori chicken and steamed basmati rice.',329,false,'curry',true),
    dish('bh4','Veg Biryani Feast','Garden vegetables, aromatic spices, raita and a little extra love.',219,true,'biryani'),
    dish('bh5','Chocolate Celebration','A rich chocolate cake slice. The perfect sweet ending.',129,true,'dessert') ]},
  {id:'bun-and-done',name:'Bun & Done',cuisines:['Burgers','American'],rating:4.5,time:20,distance:'0.8',cost:300,image:photo(pics.burger),offer:'ITEMS AT ₹149',tag:'Foodly exclusive',veg:false,dishes:[
    dish('bd1','The Classic Smash','Double smashed patty, melted cheese, pickles & our secret sauce.',249,false,'burger',true),
    dish('bd2','Crispy Paneer Burger','Golden paneer, crunchy slaw and smoky chipotle mayo.',199,true,'burger',true),
    dish('bd3','Big Cheese Burger','A generously cheesy veggie patty, lettuce and tomato relish.',149,true,'burger'),
    dish('bd4','Chocolate Fudge Cake','Warm, rich chocolate cake with a gooey centre.',129,true,'dessert') ]},
  {id:'dough-story',name:'The Dough Story',cuisines:['Pizza','Italian'],rating:4.7,time:30,distance:'2.1',cost:450,image:photo(pics.pizza),offer:'50% OFF up to ₹120',tag:'Wood-fired goodness',veg:false,dishes:[
    dish('ds1','Margherita, The Original','Hand-stretched dough, tomatoes, mozzarella & fresh basil.',299,true,'pizza',true),
    dish('ds2','Farmhouse Pizza','Mushrooms, peppers, onion and olives on a bubbling cheese base.',349,true,'pizza'),
    dish('ds3','Smoky Chicken Pizza','Smoked chicken, roasted peppers and a barbecue swirl.',399,false,'pizza',true),
    dish('ds4','Italian Chocolate Cake','A soft chocolate slice for your sweet tooth.',149,true,'dessert') ]},
  {id:'green-fork',name:'The Green Fork',cuisines:['Healthy','Salads'],rating:4.8,time:20,distance:'1.5',cost:350,image:photo(pics.bowl),offer:'₹100 OFF above ₹499',tag:'Feel-good food',veg:true,dishes:[
    dish('gf1','The Everyday Buddha Bowl','Quinoa, roasted vegetables, hummus and a bright tahini dressing.',279,true,'bowl',true),
    dish('gf2','Avocado Rainbow Salad','Fresh greens, avocado, cherry tomatoes and toasted seeds.',299,true,'bowl'),
    dish('gf3','Protein Power Bowl','Spiced chickpeas, brown rice and a crunchy seasonal salad.',249,true,'bowl',true),
    dish('gf4','Paneer Tikka Bowl','Grilled paneer, fragrant rice, fresh salad and mint dressing.',269,true,'curry') ]},
  {id:'punjab-junction',name:'Punjab Junction',cuisines:['North Indian','Biryani'],rating:4.4,time:35,distance:'2.8',cost:400,image:photo(pics.curry),offer:'50% OFF up to ₹120',tag:'Made with love',veg:false,dishes:[
    dish('pj1','Signature Butter Chicken','Tandoor-roasted chicken in a silky tomato and butter gravy.',349,false,'curry',true),
    dish('pj2','Paneer Butter Masala','Soft paneer cubes in our slow-simmered makhani sauce.',289,true,'curry',true),
    dish('pj3','Dal & Rice Comfort Bowl','Homestyle lentils, fluffy basmati rice and a side of pickle.',199,true,'bowl'),
    dish('pj4','Chicken Dum Biryani','A generous helping of our fragrant chicken biryani.',279,false,'biryani') ]},
  {id:'wok-this-way',name:'Wok This Way',cuisines:['Chinese','Asian'],rating:4.3,time:25,distance:'1.7',cost:300,image:photo(pics.noodles),offer:'50% OFF up to ₹120',tag:'Fresh off the wok',veg:false,dishes:[
    dish('ww1','Chilli Garlic Noodles','Wok-tossed noodles, crunchy vegetables and a fiery garlic sauce.',219,true,'noodles',true),
    dish('ww2','Chicken Ramen Bowl','Springy noodles, tender chicken and a deeply savoury broth.',299,false,'noodles'),
    dish('ww3','Veg Hakka Noodles','A street-style favourite with colourful vegetables.',189,true,'noodles'),
    dish('ww4','Schezwan Rice Bowl','Fragrant rice tossed with vegetables and our house chilli paste.',199,true,'bowl') ]},
  {id:'sweet-spot',name:'The Sweet Spot',cuisines:['Desserts','Bakery'],rating:4.7,time:20,distance:'0.9',cost:250,image:photo(pics.dessert),offer:'Save with FOODLY50',tag:'A little happiness',veg:true,dishes:[
    dish('ss1','Belgian Chocolate Cake','Three layers of dark chocolate sponge and silky ganache.',179,true,'dessert',true),
    dish('ss2','Fudge Brownie','A fudgy centre, crackly top and a whole lot of chocolate.',129,true,'dessert',true),
    dish('ss3','Celebration Cake Slice','A generous slice of our freshly baked chocolate cake.',149,true,'dessert') ]},
  {id:'dosa-days',name:'Dosa Days',cuisines:['South Indian','Breakfast'],rating:4.6,time:25,distance:'1.1',cost:200,image:photo(pics.dosa),offer:'ITEMS AT ₹99',tag:'Breakfast, all day',veg:true,dishes:[
    dish('dd1','Classic Masala Dosa','Crispy golden dosa, spiced potato, fresh chutneys and sambar.',149,true,'dosa',true),
    dish('dd2','Ghee Roast Dosa','Paper-thin dosa roasted in ghee with all the classic sides.',169,true,'dosa',true),
    dish('dd3','Plain Dosa','The simple things, done beautifully. Served with chutney & sambar.',99,true,'dosa'),
    dish('dd4','South Indian Rice Bowl','Comforting lemon rice, seasonal vegetables and a side of pickle.',129,true,'bowl') ]},
];
export const categories = [
  {name:'Biryani',image:photo(pics.biryani,260)}, {name:'Burgers',image:photo(pics.burger,260)},
  {name:'Pizza',image:photo(pics.pizza,260)}, {name:'South Indian',image:photo(pics.dosa,260)},
  {name:'Chinese',image:photo(pics.noodles,260)}, {name:'Healthy',image:photo(pics.bowl,260)},
  {name:'North Indian',image:photo(pics.curry,260)}, {name:'Desserts',image:photo(pics.dessert,260)},
];
export const statuses = ['Placed','Preparing','Out for delivery','Delivered'] as const;
export type Order = { events?:{status:string;at:number}[];preparationMinutes?:number;queueMinutes?:number;rescueDealId?:string|null;squadId?:string|null; id:string;restaurantId:string;restaurantName:string;items:(Dish & {quantity:number})[];subtotal:number;discount:number;delivery:number;tax:number;total:number;coupon:string|null;address:string;phone:string;note:string;schedule:string;payment:string;status:string;createdAt:number;updatedAt:number };


