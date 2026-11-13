import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler,json,body,assertOrigin,ApiError } from '@/server/http';
import { observationInput } from '@/contracts/progress';
import { observationData,checkReplay,ownedRecord } from '@/server/observations';
import { z } from 'zod';
export const runtime='nodejs';
export const POST=handler(async request=>{
  assertOrigin(request); const userId=await requireUser();const input=observationInput.parse(await body(request));const data=observationData(userId,input);
  let row;let status=201;
  try{row=await db().observation.create({data})}catch(error){
    if((error as {code?:string}).code!=='P2002')throw error;
    row=await db().observation.findUnique({where:{userId_requestId:{userId,requestId:input.requestId}}});
    if(!row)throw error;checkReplay(row,data.payloadHash);status=200;
  }
  return json({id:row.id,metric:row.metric,value:Number(row.value),measuredAt:row.measuredAt.toISOString()},status);
});
export const DELETE=handler(async request=>{
  assertOrigin(request);const userId=await requireUser();const {id}=z.object({id:z.string().min(1).max(64)}).strict().parse(await body(request));
  const result=await db().observation.updateMany({where:ownedRecord(userId,id),data:{voidedAt:new Date()}});
  if(!result.count)throw new ApiError(404,'NOT_FOUND');return json({voided:true});
});
