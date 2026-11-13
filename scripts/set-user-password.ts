import 'dotenv/config';
import { db } from '../src/server/db';
import { hashPassword } from '../src/server/passwords';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !email.includes('@') || !password) {
  console.error('Usage: npx tsx scripts/set-user-password.ts <email> <password>');
  process.exit(1);
}

const prisma = db();

try {
  const hash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      role: 'CLIENT',
    },
    update: {
      passwordHash: hash,
    },
  });
  console.log(`Password updated successfully for user ID: ${user.id} (${user.email})`);
} catch (err) {
  console.error('Failed to set password:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

