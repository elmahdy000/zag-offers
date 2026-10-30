export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zagoffers.online';
export const API_URL = `${BASE_URL}/api`;

export const CAT_ASSETS: Record<string, string> = {
  'نعيماً':        '/categories/barber.png',
  'حلويات':       '/categories/sweets.png',
  'حلى بوقك':      '/categories/sweets.png',
  'مناسبات':       '/categories/wedding.png',
  'عروستي':       '/categories/wedding.png',
  'ألعاب':         '/categories/games.png',
  'اون فاير':      '/categories/games.png',
  'أطفال':         '/categories/kids.png',
  'عيالنا':        '/categories/kids.png',
  'أدوات منزلية':  '/categories/home.png',
  'ست البيت':      '/categories/home.png',
  'كورسات':       '/categories/education.png',
  'default':       '/categories/food.png',
};

export interface Neighborhood {
  name: string;
  desc: string;
  icon: string;
}

export const ZAGAZIG_NEIGHBORHOODS: Neighborhood[] = [
  { name: 'الكل', desc: 'كل أحياء وعروض الزقازيق', icon: 'stars' },
  { name: 'القومية', desc: 'أشهر المطاعم والكافيهات والبراندات', icon: 'restaurant' },
  { name: 'فلل الجامعة', desc: 'أماكن روقان وكافيهات شبابية هادئة', icon: 'coffee' },
  { name: 'الفلل', desc: 'كافيهات ومطاعم محيط الجامعة الراقي', icon: 'coffee' },
  { name: 'طلبة عويضة', desc: 'أكلات سريعة وساندوتشات وجبات خفيفة', icon: 'fastfood' },
  { name: 'المشاية', desc: 'إطلالة بحر مويس وخروجات رايقة', icon: 'water' },
  { name: 'شارع المحافظة', desc: 'محلات وسط البلد ومستلزمات التسوق', icon: 'store' },
  { name: 'وسط البلد', desc: 'مركز المدينة والأسواق التجارية الكبرى', icon: 'store' },
  { name: 'المنتزه', desc: 'أماكن عائلية وأنشطة ترفيهية', icon: 'park' },
  { name: 'حي الزهور', desc: 'خدمات وأسواق متنوعة', icon: 'flower' },
  { name: 'الصيادين', desc: 'محلات وتجارة وخدمات محلية', icon: 'tag' },
  { name: 'الجامعة', desc: 'محيط كليات جامعة الزقازيق والخدمات الطلابية', icon: 'school' },
  { name: 'السلام', desc: 'أحياء سكنية هادئة ومحلات خدمية', icon: 'home' },
  { name: 'الحكماء', desc: 'عيادات ومراكز طبية وخدمات متخصصة', icon: 'medical' },
];

export const ZAGAZIG_AREAS = [
  'الكل',
  'القومية',
  'الفلل',
  'فلل الجامعة',
  'الجامعة',
  'طلبة عويضة',
  'وسط البلد',
  'شارع المحافظة',
  'المشاية',
  'حي الزهور',
  'الصيادين',
  'المنتزه',
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
