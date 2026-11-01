import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {featureFromSlug,featurePath} from '../../feature-routes';
import {tools} from '../../foodly';
type Props={params:Promise<{feature:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const id=featureFromSlug((await params).feature),tool=tools.find(t=>t.id===id);return {title:tool?`${tool.name} | Foodly`:'Page not found | Foodly',description:tool?.description};}
export default async function FeaturePage({params}:Props){const id=featureFromSlug((await params).feature);if(!id)notFound();redirect(featurePath(id));}
