import { ZodError } from 'zod';
export class ApiError extends Error { constructor(public status:number,public code:string){super(code)} }
export const json = (data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export function handler(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await fn(request);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.code }, e.status);
      if (e instanceof ZodError) return json({ error: 'INVALID_INPUT', issues: e.issues.map(i => ({ path: i.path, message: i.message })) }, 400);
      return json({ error: 'INTERNAL_ERROR' }, 500);
    }
  };
}

export function dynamicHandler<P = { id: string }>(
  fn: (request: Request, context: { params: Promise<P> }) => Promise<Response>
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    try {
      return await fn(request, context);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.code }, e.status);
      if (e instanceof ZodError) return json({ error: 'INVALID_INPUT', issues: e.issues.map(i => ({ path: i.path, message: i.message })) }, 400);
      return json({ error: 'INTERNAL_ERROR' }, 500);
    }
  };
}
export async function body(request:Request):Promise<unknown>{
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ApiError(415,'JSON_REQUIRED');
  // Enforce the limit while reading, including requests without Content-Length.
  const reader=request.body?.getReader(); if(!reader)throw new ApiError(400,'BODY_REQUIRED');
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new ApiError(413,'BODY_TOO_LARGE')}chunks.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
  try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new ApiError(400,'INVALID_JSON')}
}
export function assertOrigin(request:Request){
  if(!process.env.APP_ORIGIN)throw new ApiError(503,'ORIGIN_NOT_CONFIGURED');
  if(request.headers.get('origin')!==new URL(process.env.APP_ORIGIN).origin)throw new ApiError(403,'ORIGIN_REJECTED');
}
