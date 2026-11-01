export class AppError extends Error {constructor(message:string,public status=400){super(message);}}
export function fail(message:string,status=400):never{throw new AppError(message,status);}
export async function readBody(request:Request,max=24000):Promise<Record<string,any>>{
 if(Number(request.headers.get('content-length')||0)>max)fail('Request is too large.',413);
 const text=await request.text();if(text.length>max)fail('Request is too large.',413);
 try{const data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))fail('Invalid request.');return data;}catch(error){if(error instanceof AppError)throw error;fail('Invalid JSON request.');}
}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return;const configured=process.env.APP_URL;const expected=configured?new URL(configured).origin:new URL(request.url).origin;if(origin!==expected)fail('Request origin is not allowed.',403);}
export function errorResponse(error:unknown){if(error instanceof AppError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});console.error('Foodly request failed:',(error as {code?:string}).code||(error as Error).name);return Response.json({error:'The server could not complete that request. Check the database connection and retry.'},{status:503});}

