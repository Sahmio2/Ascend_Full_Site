import test from 'node:test';
import assert from 'node:assert/strict';
import { observationInput,listInput } from '../src/contracts/progress';
import { observationData,checkReplay,ownedRecord,periodStart } from '../src/server/observations';
import { assertOrigin,body,ApiError } from '../src/server/http';
import { sessionIsActive } from '../src/server/auth';
import catalogue from '../prisma/catalogue.json';
const valid={requestId:'198a8916-6506-47bc-8cb6-375fc0a74227',metric:'BODYWEIGHT_KG' as const,value:78.4,measuredAt:'2026-01-01T12:00:00Z'};
test('rejects ownership injection, wrong units, invalid numbers and future observations',()=>{
 for(const input of [{...valid,userId:'victim'},{...valid,metric:'BODYWEIGHT_LB'},{...valid,value:-1},{...valid,value:351},{...valid,value:NaN},{...valid,measuredAt:'2999-01-01T00:00:00Z'},{...valid,measuredAt:'not-a-date'}])assert.equal(observationInput.safeParse(input).success,false);
 assert.equal(observationInput.safeParse(valid).success,true);
});
test('normalizes equivalent timestamps for duplicate detection',()=>{const a=observationData('owner',valid);const b=observationData('owner',{...valid,measuredAt:'2026-01-01T13:00:00+01:00'});assert.equal(a.payloadHash,b.payloadHash);checkReplay({payloadHash:a.payloadHash,voidedAt:null},b.payloadHash);assert.throws(()=>checkReplay({payloadHash:a.payloadHash,voidedAt:null},observationData('owner',{...valid,value:80}).payloadHash),/IDEMPOTENCY_CONFLICT/);assert.throws(()=>checkReplay({payloadHash:a.payloadHash,voidedAt:new Date()},a.payloadHash),/RECORD_VOIDED/)});
test('removal predicate always includes authenticated owner',()=>{assert.deepEqual(ownedRecord('alice','bob-record'),{id:'bob-record',userId:'alice',voidedAt:null})});
test('expired and revoked sessions fail closed',()=>{const now=new Date('2026-01-01');assert.equal(sessionIsActive(null,now),false);assert.equal(sessionIsActive({expiresAt:now,revokedAt:null},now),false);assert.equal(sessionIsActive({expiresAt:new Date('2027-01-01'),revokedAt:now},now),false);assert.equal(sessionIsActive({expiresAt:new Date('2027-01-01'),revokedAt:null},now),true)});
test('mutation rejects cross-origin and missing-origin requests',()=>{process.env.APP_ORIGIN='https://ascend.example';assert.throws(()=>assertOrigin(new Request('https://ascend.example/api',{headers:{origin:'https://attacker.example'}})),/ORIGIN_REJECTED/);assert.throws(()=>assertOrigin(new Request('https://ascend.example/api')),/ORIGIN_REJECTED/);assertOrigin(new Request('https://ascend.example/api',{headers:{origin:'https://ascend.example'}}))});
test('body limit is enforced without Content-Length',async()=>{await assert.rejects(body(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({x:'x'.repeat(9000)})})),(e:unknown)=>e instanceof ApiError&&e.status===413)});
test('strict bounded periods and pagination; all-time has no cutoff',()=>{assert.equal(listInput.parse({}).period,'12w');assert.equal(listInput.safeParse({page:-1}).success,false);assert.equal(listInput.safeParse({userId:'victim'}).success,false);assert.equal(periodStart('all'),undefined);assert.equal(periodStart('4w',new Date('2026-02-01T00:00:00Z'))?.toISOString(),'2026-01-04T00:00:00.000Z')});
test('complete catalogue has unique IDs, eight groups and disabled award evaluation',()=>{assert.equal(catalogue.groups.length,8);assert.equal(catalogue.definitions.length,96);assert.equal(new Set(catalogue.definitions.map(x=>x.id)).size,96);assert.ok(catalogue.definitions.every(x=>!x.evaluationEnabled));assert.equal(catalogue.definitions.find(x=>x.id==='iron-ascendant')?.threshold,1000)});
