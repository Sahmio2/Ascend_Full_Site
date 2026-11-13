import { z } from 'zod';
export const observationInput=z.object({
  requestId:z.uuid(),metric:z.enum(['BODYWEIGHT_KG','WAIST_CM']),
  value:z.number().finite().positive().multipleOf(0.001),
  measuredAt:z.iso.datetime({offset:true}).refine(v=>new Date(v).getTime()<=Date.now(),'Measurement cannot be in the future')
}).strict().superRefine((v,ctx)=>{const [min,max]=v.metric==='BODYWEIGHT_KG'?[20,350]:[30,220];if(v.value<min||v.value>max)ctx.addIssue({code:'custom',path:['value'],message:`Expected ${min}–${max}. Contact your coach for values outside this range.`})});
export const listInput=z.object({metric:z.enum(['BODYWEIGHT_KG','WAIST_CM']).default('BODYWEIGHT_KG'),period:z.enum(['4w','12w','all']).default('12w'),page:z.coerce.number().int().min(1).max(100000).default(1)}).strict();
export type ObservationInput=z.infer<typeof observationInput>;
export type ProgressRecord={id:string;metric:ObservationInput['metric'];value:number;measuredAt:string};
export type ProgressResponse={records:ProgressRecord[];page:number;hasMore:boolean;period:'4w'|'12w'|'all';metric:ObservationInput['metric']};
