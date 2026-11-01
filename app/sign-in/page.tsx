import type {Metadata} from 'next';
import AccountForm from '../account-form';
import {safeReturnPath} from '../account-paths';
export const metadata:Metadata={title:'Sign in | Foodly',description:'Sign in to your Foodly account with your email and password.',robots:{index:false,follow:false}};
export default async function SignInPage({searchParams}:{searchParams:Promise<{returnTo?:string}>}){return <AccountForm mode="login" returnTo={safeReturnPath((await searchParams).returnTo)}/>;}
