import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetPassword() {
  const hash = await bcrypt.hash('password123', 10);
  const updated = await prisma.user.update({
    where: { phone: '01000000000' },
    data: { password: hash }
  });
  console.log('Password reset successfully for:', updated.phone);
}

resetPassword()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
