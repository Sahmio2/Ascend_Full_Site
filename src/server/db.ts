import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
const globalDb = globalThis as unknown as {ascendDb?:PrismaClient};
export function db(): PrismaClient {
  if (globalDb.ascendDb) return globalDb.ascendDb;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({host:url.hostname,port:Number(url.port||3306),user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),database:decodeURIComponent(url.pathname.slice(1)),connectionLimit:3,ssl:process.env.DATABASE_TLS==='true'?{rejectUnauthorized:true}:undefined});
  return globalDb.ascendDb = new PrismaClient({adapter});
}
