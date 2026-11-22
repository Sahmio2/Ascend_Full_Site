import { z } from 'zod';
import { db } from '@/server/db';
import { handler, json, body, assertOrigin } from '@/server/http';
import { createAuthChallenge } from '@/server/challenges';
import { requireUser } from '@/server/auth';
import type { EligibilityStatus } from '@/generated/prisma/client';

export const runtime = 'nodejs';

const screeningSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  whatsappNumber: z.string().min(3, 'WhatsApp number is required'),
  email: z.string().email('Valid email address is required'),
  mainGoal: z.string().min(1, 'Physique goal is required'),
  gymExperience: z.string().min(1, 'Gym experience is required'),
  trainingLocation: z.string().min(1, 'Training location is required'),
  daysPerWeek: z.string().min(1, 'Training days per week is required'),
  ageRange: z.string().min(1, 'Age range is required'),
  medicalClearance: z.string().min(1, 'Medical clearance status is required'),
  readySevenDays: z.string().min(1, 'Readiness confirmation is required'),
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const data = await body(request);
  const validated = screeningSchema.parse(data);
  const normalizedEmail = validated.email.toLowerCase().trim();

  // Evaluate eligibility status
  let eligibility: EligibilityStatus = 'CLEAR';
  if (validated.ageRange === 'Under 16') {
    return json(
      {
        ok: false,
        eligibility: 'UNDER_16',
        error: 'ASCEND accepts athletes aged 16 and above. No account has been created.',
      },
      403
    );
  } else if (validated.medicalClearance === 'Yes' || validated.medicalClearance === 'Unsure') {
    eligibility = 'SAFETY_HOLD';
  } else if (
    validated.trainingLocation === 'Home without equipment' ||
    validated.trainingLocation === 'No reliable training space yet'
  ) {
    eligibility = 'EQUIPMENT_HOLD';
  } else if (validated.readySevenDays !== 'Yes') {
    eligibility = 'NOT_READY';
  } else if (validated.ageRange === '16–17' || validated.ageRange === '16-17') {
    eligibility = 'GUARDIAN_PENDING';
  }

  const prisma = db();

  // Find or create User record
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: 'CLIENT',
      },
    });
  }

  // Upsert RegistrantScreening record
  const screening = await prisma.registrantScreening.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: validated.firstName.trim(),
      whatsappNumber: validated.whatsappNumber.trim(),
      mainGoal: validated.mainGoal,
      gymExperience: validated.gymExperience,
      trainingLocation: validated.trainingLocation,
      daysPerWeek: validated.daysPerWeek,
      ageRange: validated.ageRange,
      medicalClearance: validated.medicalClearance,
      readySevenDays: validated.readySevenDays,
      eligibility,
    },
    update: {
      firstName: validated.firstName.trim(),
      whatsappNumber: validated.whatsappNumber.trim(),
      mainGoal: validated.mainGoal,
      gymExperience: validated.gymExperience,
      trainingLocation: validated.trainingLocation,
      daysPerWeek: validated.daysPerWeek,
      ageRange: validated.ageRange,
      medicalClearance: validated.medicalClearance,
      readySevenDays: validated.readySevenDays,
      eligibility,
    },
  });

  // Create single-use 6-digit email OTP challenge
  const challenge = await createAuthChallenge({
    identifier: normalizedEmail,
    type: 'CLIENT_EMAIL_OTP',
  });

  return json({
    ok: true,
    eligibility: screening.eligibility,
    userId: user.id,
    email: user.email,
    ...(challenge.devCode ? { devCode: challenge.devCode } : {}),
  });
});

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();
  const screening = await prisma.registrantScreening.findUnique({
    where: { userId },
  });

  return json({
    ok: true,
    screening,
  });
});
