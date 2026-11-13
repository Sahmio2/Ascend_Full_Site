import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import { db } from '../src/server/db';

// Block development session issuance unconditionally in production, regardless of ALLOW_DEV_SESSIONS
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  throw new Error('Development session issuance is strictly forbidden in production.');
}

if (process.env.ALLOW_DEV_SESSIONS !== 'true') {
  throw new Error('Local developer provisioning is disabled. Set ALLOW_DEV_SESSIONS=true to enable.');
}

const email = process.argv[2];
if (!email || !email.includes('@')) {
  throw new Error('Pass a development email');
}

const prisma = db();
try {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  console.log('Development cookie (expires in one hour; keep private):');
  console.log(`ascend_session=${token}`);
} finally {
  await prisma.$disconnect();
}
