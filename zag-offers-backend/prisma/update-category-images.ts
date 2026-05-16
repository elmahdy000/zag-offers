import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoryImageMap: Record<string, string> = {
  'مطاعم': 'food.png',
  'كافيهات': 'cafe.png',
  'ألعاب': 'games.png',
  'حلاقين': 'barber.png',
  'تجميل': 'beauty.png',
  'جيم': 'gym.png',
  'ملابس': 'fashion.png',
  'كورسات': 'education.png',
  'حلويات': 'sweets.png',
  'خدمات سيارات': 'car.png',
  'مناسبات': 'wedding.png',
  'أطفال': 'kids.png',
  'أدوات منزلية': 'home.png',
};

// Mapping from display names to backend names if needed
const displayToBackend: Record<string, string> = {
  'دلع كرشك': 'مطاعم',
  'روقان': 'كافيهات',
  'اون فاير': 'ألعاب',
  'نعيماً': 'حلاقين',
  'دلع بنات': 'تجميل',
  'طور نفسك': 'كورسات',
  'شياكة': 'ملابس',
  'فورمة': 'جيم',
  'حلى بوقك': 'حلويات',
  'دلع عربيتك': 'خدمات سيارات',
  'عروستي': 'مناسبات',
  'عيالنا': 'أطفال',
  'ست البيت': 'أدوات منزلية',
};

async function main() {
  console.log('Updating category images in database...');

  const categories = await prisma.category.findMany();
  
  for (const cat of categories) {
    const backendName = displayToBackend[cat.name] || cat.name;
    const imageName = categoryImageMap[backendName];
    
    if (imageName) {
      const imageUrl = `http://72.62.27.196/uploads/categories/${imageName}`;
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: imageUrl }
      });
      console.log(`✅ Updated ${cat.name} with image: ${imageUrl}`);
    } else {
      console.log(`⚠️ No image mapping found for category: ${cat.name}`);
    }
  }

  console.log('All category images updated successfully!');
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
