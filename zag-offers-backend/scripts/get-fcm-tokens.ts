import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      fcmToken: {
        not: null
      }
    },
    take: 5,
    select: {
      id: true,
      name: true,
      phone: true,
      fcmToken: true
    }
  });
  
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
