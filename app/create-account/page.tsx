import type {Metadata} from 'next';
import AccountForm from '../account-form';
import {safeReturnPath} from '../account-paths';
export const metadata:Metadata={title:'Create account | Foodly',description:'Create your Foodly account to save favourites, order with friends and follow your deliveries.',robots:{index:false,follow:false}};
export default async function CreateAccountPage({searchParams}:{searchParams:Promise<{returnTo?:string}>}){return <AccountForm mode="register" returnTo={safeReturnPath((await searchParams).returnTo)}/>;}
