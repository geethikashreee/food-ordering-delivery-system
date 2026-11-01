export function safeReturnPath(value:unknown):string {
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return '/';
 try{const url=new URL(value,'https://foodly.local');if(url.origin!=='https://foodly.local'||['/sign-in','/create-account'].includes(url.pathname)||url.pathname.startsWith('/api/auth'))return '/';return url.pathname+url.search+url.hash;}catch{return '/';}
}
export function accountPath(mode:'login'|'register',returnTo='/'){return (mode==='login'?'/sign-in':'/create-account')+'?returnTo='+encodeURIComponent(safeReturnPath(returnTo));}
