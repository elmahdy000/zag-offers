export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zagoffers.online';
export const API_URL = `${BASE_URL}/api`;

export const CAT_ASSETS: Record<string, string> = {
  'الكل':          '/categories/all.png',
  'مطاعم':         '/categories/food.png',
  'كافيهات':       '/categories/cafe.png',
  'ملابس':         '/categories/fashion.png',
  'جيم':           '/categories/gym.png',
  'تجميل':         '/categories/beauty.png',
  'دورات':         '/categories/education.png',
  'خدمات سيارات': '/categories/car.png',
  'حلاقين':       '/categories/barber.png',
  'حلويات':       '/categories/sweets.png',
  'مناسبات':       '/categories/wedding.png',
  'ألعاب':         '/categories/games.png',
  'أطفال':         '/categories/kids.png',
  'أدوات منزلية':  '/categories/home.png',
  'كورسات':       '/categories/education.png',
  'default':       '/categories/food.png',
};

export const ZAGAZIG_AREAS = [
  'الكل',
  'القومية',
  'الفلل',
  'الجامعة',
  'طلبة عويضة',
  'وسط البلد',
  'المشاية',
  'حي الزهور',
  'السلام',
  'الحكماء'
];

export const DISPLAY_NAMES: Record<string, string> = {
  'مطاعم': 'دلع كرشك',
  'كافيهات': 'روقان',
  'دورات': 'طور نفسك',
  'تجميل': 'دلع بنات',
  'جيم': 'فورمة',
  'خدمات سيارات': 'دلع عربيتك',
  'ملابس': 'شياكة',
  'حلاقين': 'نعيماً',
  'حلويات': 'حلى بوقك',
  'مناسبات': 'عروستي',
  'ألعاب': 'اون فاير',
  'أطفال': 'عيالنا',
  'أدوات منزلية': 'ست البيت',
  'كورسات': 'طور نفسك',
};
