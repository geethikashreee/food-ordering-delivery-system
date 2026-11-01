import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
const keyLength=64;
function derive(password:string,salt:string,legacy=false):Promise<Buffer>{return new Promise((resolve,reject)=>scrypt(password,salt,keyLength,{N:legacy?16384:131072,r:8,p:1,maxmem:256*1024*1024},(error,key)=>error?reject(error):resolve(key)));}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return 'scrypt-v1:'+salt+':'+(await derive(password,salt)).toString('hex');}
export async function verifyPassword(password:string,encoded:string){const [algorithm,salt,key]=encoded.split(':');const valid=['scrypt-v1','scrypt'].includes(algorithm)&&/^[a-f0-9]{32}$/.test(salt||'')&&/^[a-f0-9]{128}$/.test(key||'');const computed=await derive(password,valid?salt:'0'.repeat(32),valid&&algorithm==='scrypt');const expected=Buffer.from(valid?key:'0'.repeat(128),'hex');return timingSafeEqual(computed,expected)&&valid;}
export const DUMMY_PASSWORD_HASH='scrypt-v1:'+('0'.repeat(32))+':'+('0'.repeat(128));
