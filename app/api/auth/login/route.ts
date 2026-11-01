import {NextResponse} from 'next/server';
import {authenticate,SESSION_COOKIE,cookieOptions} from '../../../auth';
import {checkOrigin,readBody,errorResponse} from '../../../../lib/http';
export const runtime='nodejs';
export async function POST(request:Request){try{checkOrigin(request);const result=await authenticate(await readBody(request,4000),'login');const response=NextResponse.json({user:result.user});response.cookies.set(SESSION_COOKIE,result.token,cookieOptions());return response;}catch(error){return errorResponse(error);}}
