import type {Metadata} from 'next';
import FoodApp from '../food-app';
export const metadata:Metadata={title:'Foodly Hub | Foodly',description:'Recommendations, group ordering, surplus meals, preparation estimates, dietary filters, rewards, tracking and insights in one place.'};
export default function FoodlyHub(){return <FoodApp initialPage="hub"/>;}
