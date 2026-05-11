import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { old: 'دلع كرشك 🍔', new: 'دلع كرشك' },
    { old: 'روقان ☕', new: 'روقان' },
    { old: 'شياكة 👔', new: 'شياكة' },
    { old: 'فورمة 🦾', new: 'فورمة' },
    { old: 'دلع بنات 💄', new: 'دلع بنات' },
    { old: 'صحتك بالدنيا 🏥', new: 'صحتك بالدنيا' },
    { old: 'ثقف نفسك 💡', new: 'على نور' },
    { old: 'على الزيرو 🏎️', new: 'على الزيرو' },
    { old: 'عروستى 👰', new: 'ليلة العمر' },
    { old: 'بيتك ومطرحك 🏠', new: 'بيتك ومطرحك' },
  ];

  // Also add missing ones
  const allNames = [
    'دلع كرشك', 'روقان', 'حلي بؤك', 'دلع بنات', 'شياكة', 
    'فورمة', 'بيتك ومطرحك', 'تكنولوجى', 'على الزيرو', 
    'صحتك بالدنيا', 'على نور', 'ليلة العمر', 'غيّر جو'
  ];

  for (const item of categories) {
    await prisma.category.updateMany({
      where: { name: item.old },
      data: { name: item.new }
    });
  }

  for (const name of allNames) {
    const exists = await prisma.category.findFirst({ where: { name } });
    if (!exists) {
      await prisma.category.create({ data: { name } });
      console.log(`Created category: ${name}`);
    }
  }

  console.log('Database categories updated successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
