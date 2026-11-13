import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler,json } from '@/server/http';
export const runtime='nodejs';
export const GET=handler(async()=>{const userId=await requireUser();const groups=await db().achievementGroup.findMany({orderBy:{position:'asc'},include:{definitions:{include:{awards:{where:{userId},orderBy:{awardedAt:'desc'}}}}}});return json({groups,automaticAwardsEnabled:false})});
