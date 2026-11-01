import {type ToolId} from './foodly';
export const featureSlugs={mood:'food-mood-ai',squad:'foodly-squad',rescue:'food-waste-rescue',queue:'smart-queue',plate:'smart-plate',streaks:'foodly-streaks',pulse:'delivery-pulse',lab:'intelligence-lab'} as const satisfies Record<ToolId,string>;
export function featurePath(id:ToolId){return '/features#'+featureSlugs[id];}
export function featureFromSlug(slug:string):ToolId|undefined{return (Object.keys(featureSlugs) as ToolId[]).find(id=>featureSlugs[id]===slug);}
