import {spawn} from 'node:child_process';
const command=process.argv[2];if(!['dev','start'].includes(command))throw Error('Expected dev or start.');
const port=process.env.PORT||'3000',host=process.env.FOODLY_HOST||(command==='dev'?'127.0.0.1':'0.0.0.0');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',command,'--hostname',host,'--port',port,...process.argv.slice(3)],{stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',()=>{process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
