import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';

const WaitlistPostSchema = z.object({
  consentGiven: z.literal(true),
  channel: z.string().optional().default('email_whatsapp'),
});

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();

  const entry = await prisma.waitlistEntry.findUnique({
    where: { userId },
  });

  return json({
    onWaitlist: !!entry,
    entry: entry ? { status: entry.status, createdAt: entry.createdAt } : null,
  });
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const raw = await body(request);
  const parsed = WaitlistPostSchema.parse(raw);

  const prisma = db();
  const entry = await prisma.waitlistEntry.upsert({
    where: { userId },
    update: {
      status: 'WAITING',
      optInProof: {
        consentGiven: parsed.consentGiven,
        channel: parsed.channel,
        updatedAt: new Date().toISOString(),
      },
    },
    create: {
      userId,
      status: 'WAITING',
      optInProof: {
        consentGiven: parsed.consentGiven,
        channel: parsed.channel,
        optedInAt: new Date().toISOString(),
      },
    },
  });

  return json({
    success: true,
    message: 'Added to ASCEND private waitlist.',
    entry: { status: entry.status, createdAt: entry.createdAt },
  });
});

export const DELETE = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const prisma = db();

  await prisma.waitlistEntry.deleteMany({
    where: { userId },
  });

  return json({
    success: true,
    message: 'Removed from ASCEND waitlist.',
  });
});
