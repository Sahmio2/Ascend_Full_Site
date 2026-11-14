import { db } from '@/server/db';
import { requireCoach } from '@/server/auth';
import { dynamicHandler, json, body, ApiError } from '@/server/http';
import { z } from 'zod';

export const runtime = 'nodejs';

async function resolveClientId(request: Request, context: { params: Promise<{ id: string }> }): Promise<string> {
  const p = await context.params;
  if (p?.id) return p.id;
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 1];
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

export const GET = dynamicHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireCoach(request);
  const clientId = await resolveClientId(request, context);
  const prisma = db();

  const user = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      programmes: {
        orderBy: { createdAt: 'desc' },
      },
      assessment: true,
      screening: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'CLIENT_NOT_FOUND');
  }

  const publishedPlan = user.programmes.find((p) => p.isPublished);
  const latestDraft = user.programmes.find((p) => !p.isPublished);

  // Determine current active or draft content
  const currentPlan = latestDraft || publishedPlan;

  let training = DEFAULT_TRAINING_TEMPLATE;
  let nutrition = DEFAULT_NUTRITION_TEMPLATE;
  let coachNotes = currentPlan?.coachNotes || '';
  let version = latestDraft ? latestDraft.version : publishedPlan ? `Draft v${parseInt(publishedPlan.version.replace(/\D/g, '') || '1', 10) + 1}` : 'Draft v1';

  if (currentPlan) {
    if (Array.isArray(currentPlan.trainingJson)) {
      training = currentPlan.trainingJson as any;
    }
    if (Array.isArray(currentPlan.nutritionJson)) {
      nutrition = currentPlan.nutritionJson as any;
    }
  }

  return json({
    ok: true,
    clientId: user.id,
    clientName: user.screening?.firstName || user.email.split('@')[0],
    publishedPlan: publishedPlan
      ? {
          id: publishedPlan.id,
          version: publishedPlan.version,
          publishedAt: publishedPlan.publishedAt,
          trainingJson: publishedPlan.trainingJson,
          nutritionJson: publishedPlan.nutritionJson,
          coachNotes: publishedPlan.coachNotes,
        }
      : null,
    draft: {
      id: latestDraft?.id || null,
      version,
      isPublished: false,
      training,
      nutrition,
      coachNotes,
      updatedAt: latestDraft?.updatedAt || null,
    },
    history: user.programmes.map((p) => ({
      id: p.id,
      version: p.version,
      isPublished: p.isPublished,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
    })),
  });
});

export const PUT = dynamicHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireCoach(request);
  const clientId = await resolveClientId(request, context);
  const raw = await body(request);
  const prisma = db();

  const schema = z.object({
    version: z.string().default('v1'),
    training: z.array(z.record(z.string(), z.any())).min(1),
    nutrition: z.array(z.record(z.string(), z.any())).min(1),
    coachNotes: z.string().optional().default(''),
  });

  const parsed = schema.parse(raw);

  const user = await prisma.user.findUnique({
    where: { id: clientId },
  });

  if (!user) {
    throw new ApiError(404, 'CLIENT_NOT_FOUND');
  }

  // Find existing unpublished draft or create a new draft
  const existingDraft = await prisma.programmeDraft.findFirst({
    where: {
      clientUserId: clientId,
      isPublished: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  const draft = existingDraft
    ? await prisma.programmeDraft.update({
        where: { id: existingDraft.id },
        data: {
          version: parsed.version,
          trainingJson: parsed.training,
          nutritionJson: parsed.nutrition,
          coachNotes: parsed.coachNotes,
        },
      })
    : await prisma.programmeDraft.create({
        data: {
          clientUserId: clientId,
          version: parsed.version,
          isPublished: false,
          trainingJson: parsed.training,
          nutritionJson: parsed.nutrition,
          coachNotes: parsed.coachNotes,
        },
      });

  return json({
    ok: true,
    draft: {
      id: draft.id,
      version: draft.version,
      isPublished: draft.isPublished,
      updatedAt: draft.updatedAt,
    },
  });
});
