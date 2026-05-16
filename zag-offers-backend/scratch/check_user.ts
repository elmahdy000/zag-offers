import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const email = 'eng.elmahdy008@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log(`User found: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Has password: ${!!user.password}`);
  } else {
    console.log('User NOT found with this email.');
    // List some users to see what's there
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Available users in DB:', users.map(u => u.email || u.phone));
  }
}

check();
