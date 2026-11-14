import { db } from '@/server/db';
import { requireCoach } from '@/server/auth';
import { dynamicHandler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';

export const runtime = 'nodejs';

async function resolveClientId(request: Request, context: { params: Promise<{ id: string }> }): Promise<string> {
  const p = await context.params;
  if (p?.id) return p.id;
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const publishIndex = parts.indexOf('publish');
  const id = publishIndex > 0 ? parts[publishIndex - 1] : parts[parts.length - 1];
  if (!id) throw new ApiError(400, 'CLIENT_ID_REQUIRED');
  return id;
}

const DEFAULT_TRAINING_TEMPLATE = [
  { name: 'Leg Press', sets: '3', reps: '8–12', rest: '120 s', swap: 'Goblet Squat' },
  { name: 'DB Romanian Deadlift', sets: '2', reps: '8–12', rest: '150 s', swap: 'Back Extension' },
  { name: 'Seated Row', sets: '3', reps: '10–12', rest: '90 s', swap: 'Cable Row' },
  { name: 'Dumbbell Bench Press', sets: '3', reps: '8–10', rest: '120 s', swap: 'Machine Chest Press' },
  { name: 'Lat Pulldown', sets: '3', reps: '10–12', rest: '90 s', swap: 'Neutral-Grip Pull-Up' },
];

const DEFAULT_NUTRITION_TEMPLATE = [
  { meal: 'Breakfast', food: 'Oats · dry', amount: '70 g', other: 'Boiled eggs · whole cooked 100 g' },
  { meal: 'Lunch', food: 'Rice · white cooked', amount: '180 g', other: 'Fish · mackerel grilled 130 g' },
  { meal: 'Dinner', food: 'Eba · prepared', amount: '180 g', other: 'Egusi soup · verified recipe 200 g' },
];

export const POST = dynamicHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  assertOrigin(request);
  const { user: coachUser } = await requireCoach(request);
  const clientId = await resolveClientId(request, context);
  const raw = await body(request);
  const prisma = db();

  const schema = z.object({
    checksConfirmed: z.array(z.boolean()).length(3),
    version: z.string().optional(),
    training: z.array(z.record(z.string(), z.any())).optional(),
    nutrition: z.array(z.record(z.string(), z.any())).optional(),
    coachNotes: z.string().optional(),
  });

  const parsed = schema.parse(raw);

  if (!parsed.checksConfirmed.every(Boolean)) {
    throw new ApiError(400, 'ALL_PUBLICATION_CHECKS_REQUIRED');
  }

  // Verify client existence
  const clientUser = await prisma.user.findUnique({
    where: { id: clientId },
    include: { assessment: true },
  });

  if (!clientUser) {
    throw new ApiError(404, 'CLIENT_NOT_FOUND');
  }

  if (clientUser.assessment?.status === 'SAFETY_HELD') {
    throw new ApiError(403, 'SAFETY_HOLD_ACTIVE');
  }

  // Atomic publication transaction with deadlock retry
  let publishedProgramme;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      publishedProgramme = await prisma.$transaction(async (tx) => {
        const now = new Date();

        // 1. Locate current unpublished draft BEFORE superseding active records (publishedAt must be null)
        const draft = await tx.programmeDraft.findFirst({
          where: { clientUserId: clientId, isPublished: false, publishedAt: null },
          orderBy: { createdAt: 'desc' },
        });

        // 2. Supersede any existing published programme for this client
        await tx.programmeDraft.updateMany({
          where: {
            clientUserId: clientId,
            isPublished: true,
          },
          data: {
            isPublished: false,
          },
        });

        // 3. Determine version name
        const existingCount = await tx.programmeDraft.count({
          where: { clientUserId: clientId },
        });
        const targetVersion = parsed.version || `Active v${existingCount + (draft ? 0 : 1)}`;

        const auditEntry = `Published by coach ${coachUser.email} on ${now.toISOString()}`;
        const combinedNotes = parsed.coachNotes
          ? `${parsed.coachNotes}\n\n[Audit]: ${auditEntry}`
          : draft?.coachNotes
          ? `${draft.coachNotes}\n\n[Audit]: ${auditEntry}`
          : `[Audit]: ${auditEntry}`;

        let published;
        if (draft) {
          published = await tx.programmeDraft.update({
            where: { id: draft.id },
            data: {
              version: targetVersion,
              isPublished: true,
              publishedAt: now,
              ...(parsed.training ? { trainingJson: parsed.training } : {}),
              ...(parsed.nutrition ? { nutritionJson: parsed.nutrition } : {}),
              coachNotes: combinedNotes,
            },
          });
        } else {
          published = await tx.programmeDraft.create({
            data: {
              clientUserId: clientId,
              version: targetVersion,
              isPublished: true,
              publishedAt: now,
              trainingJson: parsed.training || DEFAULT_TRAINING_TEMPLATE,
              nutritionJson: parsed.nutrition || DEFAULT_NUTRITION_TEMPLATE,
              coachNotes: combinedNotes,
            },
          });
        }

        // 4. Mark client assessment as APPROVED
        await tx.clientAssessment.upsert({
          where: { userId: clientId },
          update: {
            status: 'APPROVED',
          },
          create: {
            userId: clientId,
            status: 'APPROVED',
          },
        });

        return published;
      });
      break;
    } catch (err: any) {
      const isDeadlock =
        err?.code === 'P2034' ||
        String(err?.message || '').toLowerCase().includes('deadlock') ||
        String(err?.message || '').toLowerCase().includes('lock wait');
      if (isDeadlock && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }
      if (isDeadlock) {
        throw new ApiError(409, 'CONCURRENT_PUBLICATION_CONFLICT');
      }
      throw err;
    }
  }

  if (!publishedProgramme) {
    throw new ApiError(500, 'PUBLICATION_FAILED');
  }

  return json({
    ok: true,
    programme: {
      id: publishedProgramme.id,
      version: publishedProgramme.version,
      isPublished: publishedProgramme.isPublished,
      publishedAt: publishedProgramme.publishedAt,
      author: coachUser.email,
    },
  });
});
