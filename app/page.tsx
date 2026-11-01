import FoodApp from './food-app';
export default async function Home({searchParams}:{searchParams:Promise<{view?:string}>}){const requested=(await searchParams).view;const view=requested&&['orders','kitchen','favourites'].includes(requested)?requested:'home';return <FoodApp initialPage={view}/>;}
