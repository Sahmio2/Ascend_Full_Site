import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';

const WaitlistPostSchema = z.object({
  consentGiven: z.literal(true),
  channel: z.string().optional().default('email_whatsapp'),
  email: z.string().email().optional(),
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
  const raw = await body(request);
  const parsed = WaitlistPostSchema.parse(raw);
  const prisma = db();

  let targetUserId: string;
  try {
    targetUserId = await requireUser(request);
  } catch {
    if (!parsed.email) {
      throw new ApiError(400, 'EMAIL_REQUIRED_FOR_UNAUTHENTICATED_WAITLIST');
    }
    const normalizedEmail = parsed.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, role: 'CLIENT' },
      });
    }
    targetUserId = user.id;
  }

  const entry = await prisma.waitlistEntry.upsert({
    where: { userId: targetUserId },
    update: {
      status: 'WAITING',
      optInProof: {
        consentGiven: parsed.consentGiven,
        channel: parsed.channel,
        updatedAt: new Date().toISOString(),
      },
    },
    create: {
      userId: targetUserId,
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
