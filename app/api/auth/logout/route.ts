import {NextResponse} from 'next/server';
import {signOut,SESSION_COOKIE,cookieOptions} from '../../../auth';
import {checkOrigin,errorResponse} from '../../../../lib/http';
export const runtime='nodejs';
export async function POST(request:Request){try{checkOrigin(request);await signOut();const response=NextResponse.redirect(new URL('/',request.url),303);response.cookies.set(SESSION_COOKIE,'',{...cookieOptions(),maxAge:0});return response;}catch(error){return errorResponse(error);}}
