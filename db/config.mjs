import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({path:'.env.local',quiet:true});dotenv.config({path:'.env',quiet:true});
export function mysqlOptions({database=true}={}){
 const host=(process.env.MYSQL_HOST||'').trim(),user=(process.env.MYSQL_USER||'').trim(),name=(process.env.MYSQL_DATABASE||'food_db').trim(),port=Number(process.env.MYSQL_PORT||3306);
 if(!host||!user)throw Error('Set MYSQL_HOST and MYSQL_USER in .env.local before connecting.');
 if(!/^[A-Za-z0-9_]{1,64}$/.test(name))throw Error('MYSQL_DATABASE must contain only letters, numbers and underscores, up to 64 characters.');
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('MYSQL_PORT is invalid.');
 const local=['localhost','127.0.0.1','::1'].includes(host),password=process.env.MYSQL_PASSWORD||'';
 if(!password&&!local)throw Error('Set MYSQL_PASSWORD privately in .env.local or your host environment.');
 const useTLS=process.env.MYSQL_SSL?process.env.MYSQL_SSL==='true':!local;
 const caFile=process.env.MYSQL_SSL_CA_FILE,ca=caFile?fs.readFileSync(caFile,'utf8'):(process.env.MYSQL_SSL_CA||'').replaceAll('\\n','\n');
 return {host,port,user,password,...(database?{database:name}:{}),charset:'utf8mb4',connectTimeout:10000,supportBigNumbers:true,bigNumberStrings:false,...(useTLS?{ssl:{rejectUnauthorized:true,...(ca?{ca}:{})}}:{})};
}
