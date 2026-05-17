import { Category } from '@/lib/types';

export function normalizeCategories(raw: unknown): Category[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: unknown[] }).items
      : [];

  return list
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      id: String(c.id ?? ''),
      name: String(c.name ?? ''),
      description: c.description ? String(c.description) : undefined,
      icon: c.icon ? String(c.icon) : undefined,
      image: c.image ? String(c.image) : undefined,
      priority: typeof c.priority === 'number' ? c.priority : undefined,
    }))
    .filter((c) => c.id && c.name);
}

