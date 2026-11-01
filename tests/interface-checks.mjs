import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),root=path.resolve('.'),out=path.join(root,'tests','.compiled');
const files=['app/catalog.ts','app/foodly.ts','app/pricing.ts','app/feature-routes.ts','app/account-paths.ts','app/foodly-icons.tsx','app/feature-hub.tsx','app/feature-dashboard.tsx','app/food-app.tsx','app/account-form.tsx','app/admin-orders.tsx','app/features/page.tsx','app/features/[feature]/page.tsx','app/dashboard/page.tsx','app/admin/orders/page.tsx','app/api/admin/orders/route.ts','db/schema.ts','lib/password.ts','lib/http.ts','lib/admin-access.ts','lib/order-report.ts'];
await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'package.json'),'{"type":"commonjs"}');
for(const file of files){const source=await fs.readFile(path.join(root,file),'utf8'),target=path.join(out,file.replace(/\.tsx?$/,'.js'));await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText);}
const load=file=>require(path.join(out,file));
const {featureSlugs,featurePath,featureFromSlug}=load('app/feature-routes.js');
const {safeReturnPath}=load('app/account-paths.js');
const FoodApp=load('app/food-app.js').default,AccountForm=load('app/account-form.js').default;
let checks=0;function check(condition,message){assert.ok(condition,message);checks++;}
const html=renderToStaticMarkup(React.createElement(FoodApp));
check(html.includes('href="/features"'),'Homepage links to Foodly Hub');
check(!html.includes('>Dashboard<'),'Dashboard label is removed from navigation');
check(!html.includes('class="feature-rail"'),'Homepage does not repeat all feature links');
const hub=renderToStaticMarkup(React.createElement(FoodApp,{initialPage:'hub'}));
check(hub.includes('<h1>Foodly Hub</h1>'),'Foodly Hub has its own page heading');
const FeatureHub=load('app/feature-hub.js').default;
const props={user:null,orders:[],cart:{restaurantId:'',items:[]},onAdd(){},onRescue(){},onSquad(){},onTrack(){},onSignIn(){},onRoute(){},onBack(){},onNotify(){},embedded:true};
for(const [id,slug] of Object.entries(featureSlugs)){
 check(featurePath(id)==='/features#'+slug,id+' links to the unified page');
 check(featureFromSlug(slug)===id,id+' maps correctly');
 const page=load('app/features/[feature]/page.js');let redirected=false;
 try{await page.default({params:Promise.resolve({feature:slug})});}catch(error){redirected=String(error.digest).includes('/features#'+slug);}
 check(redirected,id+' legacy URL redirects to the hub');
 const content=renderToStaticMarkup(React.createElement(FeatureHub,{...props,tool:id}));
 check(content.includes('feature-'+id),id+' tool renders in the hub');
 check(!/[\p{Emoji_Presentation}\uFE0F]/u.test(content),id+' has no emoji');
}
check(featureFromSlug('unknown')===undefined,'Unknown feature is not resolved');
for(const bad of ['https://evil.example','//evil.example','/\\evil.example','javascript:alert(1)','/sign-in','/create-account','/api/auth/login'])check(safeReturnPath(bad)==='/', 'Reject unsafe return URL '+bad);
check(safeReturnPath('/features/foodly-squad?checkout=1')==='/features/foodly-squad?checkout=1','Preserve checkout return path');
for(const mode of ['login','register']){const form=renderToStaticMarkup(React.createElement(AccountForm,{mode,returnTo:featurePath('mood')}));check(form.includes('type="email"'),'Email field in '+mode);check(form.includes('type="password"'),'Password field in '+mode);check(form.toLowerCase().includes('autocomplete="'+(mode==='register'?'new-password':'current-password')+'"'),'Password autofill mode '+mode);check(!/chatgpt/i.test(form),'No ChatGPT authentication in '+mode);check(!/[\p{Emoji_Presentation}\uFE0F]/u.test(form),'No emoji in '+mode);if(mode==='register'){check(form.includes('name="name"'),'Registration asks for name');check(form.includes('name="confirmPassword"'),'Registration confirms password');}}
const {hashPassword,verifyPassword}=load('lib/password.js');const password='Test password for local checks only 42';const first=await hashPassword(password),second=await hashPassword(password);check(first!==second,'Passwords receive independent salts');check(!first.includes(password),'Plaintext is absent from the stored hash');check(await verifyPassword(password,first),'Correct password verifies');check(!await verifyPassword('Wrong password',first),'Incorrect password is rejected');check(!await verifyPassword(password,'malformed'),'Malformed hashes are rejected');
const {isAdminEmail}=load('lib/admin-access.js');
check(isAdminEmail('owner@example.com','owner@example.com'),'Configured owner is an administrator');
check(isAdminEmail('OWNER@example.com',' owner@example.com '),'Administrator email matching is normalized');
check(!isAdminEmail('customer@example.com','owner@example.com'),'Customer cannot access administrator history');
check(!isAdminEmail('owner@example.com',''),'Admin access is locked when not configured');
check(!isAdminEmail('owner@example.com.evil','owner@example.com'),'Admin addresses require an exact match');
const {parseOrderFilters,csvCell}=load('lib/order-report.js');
const filters=parseOrderFilters(new URLSearchParams({from:'2026-11-02',to:'2026-11-02',status:'Delivered'}));
check(filters.from===Date.parse('2026-11-02T00:00:00+05:30'),'Admin date filters start at India midnight');
check(filters.to-filters.from===86400000,'End date includes the full India calendar day');
for(const values of [{from:'2026-02-30'},{from:'2026-11-03',to:'2026-11-02'},{page:'0'},{page:'NaN'},{status:'Invalid'}]){let failed=false;try{parseOrderFilters(new URLSearchParams(values));}catch(error){failed=error.status===400;}check(failed,'Reject invalid report filters '+JSON.stringify(values));}
check(csvCell('=1+1').startsWith('"\''),'CSV export does not execute customer-entered formulas');
check(csvCell('Name, "quoted"')==='"Name, ""quoted"""','CSV export preserves commas and quotes');
const originalLoad=Module._load,originalAdmin=process.env.FOODLY_ADMIN_EMAILS;
let currentUser=null,databaseCalls=0;
process.env.FOODLY_ADMIN_EMAILS='owner@example.com';
Module._load=function(request,parent,isMain){
 const resolved=parent?.filename?path.resolve(path.dirname(parent.filename),request):'';
 if(resolved===path.join(out,'app','auth'))return {getCurrentUser:async()=>currentUser};
 if(resolved===path.join(out,'db'))return {getDb:()=>{databaseCalls++;throw new Error('Test database boundary');}};
 return originalLoad.apply(this,arguments);
};
try{
 const api=load('app/api/admin/orders/route.js');
 let response=await api.GET(new Request('http://foodly.local/api/admin/orders'));
 check(response.status===401,'Unauthenticated requests cannot read admin order data');
 currentUser={userId:'customer',displayName:'Customer',email:'customer@example.com'};
 response=await api.GET(new Request('http://foodly.local/api/admin/orders'));
 check(response.status===403,'Customer requests cannot read admin order data');
 check(databaseCalls===0,'Rejected requests never query customer order history');
 const adminPage=load('app/admin/orders/page.js');
 const denied=renderToStaticMarkup(await adminPage.default());
 check(denied.includes('Administrator access required'),'Customer accounts cannot render the admin interface');
 currentUser={userId:'owner',displayName:'Owner',email:'owner@example.com'};
 const allowed=renderToStaticMarkup(await adminPage.default());
 check(allowed.includes('Admin access only'),'Configured administrator can render the order-history page');
 check(!/[\p{Emoji_Presentation}\uFE0F]/u.test(allowed),'Admin history has no emoji');
 response=await api.GET(new Request('http://foodly.local/api/admin/orders?page=0'));
 check(response.status===400,'Admin API validates filters before querying orders');
}finally{Module._load=originalLoad;if(originalAdmin===undefined)delete process.env.FOODLY_ADMIN_EMAILS;else process.env.FOODLY_ADMIN_EMAILS=originalAdmin;}
console.log(checks+' interface, routing, admin-access and password checks passed.');

