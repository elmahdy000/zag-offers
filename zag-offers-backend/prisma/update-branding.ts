import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating Categories with Catchy Branding...');

  const brandingMap: Record<string, string> = {
    'مطاعم': 'دلع كرشك 🍔',
    'كافيهات': 'روقان ☕',
    'ملابس': 'شياكة 👔',
    'جيم': 'فورمة 🦾',
    'تجميل': 'دلع بنات 💄',
    'كورسات': 'ثقف نفسك 💡',
    'عيادات': 'صحتك بالدنيا 🏥',
    'خدمات سيارات': 'على الزيرو 🏎️',
  };

  // Add new specific ones if they don't exist
  const newCatchyOnes = [
    'عروستى 👰',
    'خطفة ⚡',
    'بيتك ومطرحك 🏠',
  ];

  for (const [oldName, newName] of Object.entries(brandingMap)) {
    try {
      const category = await prisma.category.findUnique({ where: { name: oldName } });
      if (category) {
        await prisma.category.update({
          where: { id: category.id },
          data: { name: newName }
        });
        console.log(`Updated: ${oldName} -> ${newName}`);
      } else {
        // If it doesn't exist, just create the new one
        await prisma.category.upsert({
          where: { name: newName },
          update: {},
          create: { name: newName }
        });
        console.log(`Created: ${newName}`);
      }
    } catch (e) {
      console.error(`Error processing ${oldName}:`, e);
    }
  }

  for (const name of newCatchyOnes) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    console.log(`Ensured: ${name}`);
  }

  console.log('Branding update completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
