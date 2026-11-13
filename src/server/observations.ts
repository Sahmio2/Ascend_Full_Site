import { createHash } from 'node:crypto';
import type { ObservationInput } from '../contracts/progress';
import { ApiError } from './http';
export function observationData(userId:string,input:ObservationInput){
  const measuredAt=new Date(input.measuredAt);
  const canonical=JSON.stringify({metric:input.metric,value:input.value,measuredAt:measuredAt.toISOString()});
  return {userId,...input,measuredAt,payloadHash:createHash('sha256').update(canonical).digest('hex')};
}
export function checkReplay(row:{payloadHash:string;voidedAt:Date|null},hash:string){
  if(row.payloadHash!==hash)throw new ApiError(409,'IDEMPOTENCY_CONFLICT');
  if(row.voidedAt)throw new ApiError(409,'RECORD_VOIDED');
}
export const ownedRecord=(userId:string,id:string)=>({id,userId,voidedAt:null});
export function periodStart(period:'4w'|'12w'|'all',now=new Date()){return period==='all'?undefined:new Date(now.getTime()-(period==='4w'?28:84)*86400000)}
