import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  BookOpen,
  BriefcaseBusiness,
  CakeSlice,
  Car,
  Coffee,
  Dumbbell,
  Gamepad2,
  HeartPulse,
  Home,
  Laptop,
  Package,
  Scissors,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'مطاعم': UtensilsCrossed,
  'دلع كرشك': UtensilsCrossed,
  'كافيهات': Coffee,
  'روقان': Coffee,
  'ملابس': Shirt,
  'شياكة': Shirt,
  'تجميل': Sparkles,
  'دلع بنات': Sparkles,
  'جميلة': Sparkles,
  'جيم': Dumbbell,
  'فورمة': Dumbbell,
  'عيادات': Stethoscope,
  'صيدليات': HeartPulse,
  'سوبرماركت': ShoppingBasket,
  'دورات': BookOpen,
  'كورسات': BookOpen,
  'طور نفسك': BookOpen,
  'خدمات سيارات': Car,
  'دلع عربيتك': Car,
  'خدمات محلية': Wrench,
  'خدمات': Wrench,
  'حلاقين': Scissors,
  'نعيماً': Scissors,
  'حلويات': CakeSlice,
  'حلى بوقك': CakeSlice,
  'ألعاب': Gamepad2,
  'اون فاير': Gamepad2,
  'أطفال': Baby,
  'عيالنا': Baby,
  'أدوات منزلية': Home,
  'ست البيت': Home,
  'إلكترونيات': Laptop,
  'مناسبات': BriefcaseBusiness,
  'عروستي': BriefcaseBusiness,
  'default': Package,
};

/**
 * Normalises an Arabic label so lookups survive spelling drift between the
 * database and the icon map: tashkeel/tatweel, alef variants (أ إ آ ٱ → ا),
 * alef maqsura (ى → ي) and teh marbuta (ة → ه).
 *
 * Real drift found in production: the API returns «أون فاير» and «نعيما»,
 * while the map held «اون فاير» and «نعيماً» — both silently fell back to the
 * generic icon, so every category looked identical.
 */
function normalizeLabel(value: string): string {
  return value
    .trim()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}

const NORMALIZED_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(CATEGORY_ICONS).map(([label, icon]) => [normalizeLabel(label), icon]),
);

export function CategoryIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon =
    NORMALIZED_ICONS[normalizeLabel(name)] ||
    CATEGORY_ICONS.default ||
    Store;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}
