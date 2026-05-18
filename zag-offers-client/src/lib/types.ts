export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  priority?: number;
}

export interface Store {
  id: string;
  name: string;
  logo?: string;
  area: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  locationUrl?: string;
  categoryId?: string;
  category?: Category;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image?: string;
  actionUrl?: string;
  isActive: boolean;
  priority: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  originalPrice?: number;
  discountedPrice?: number;
  startDate?: string;
  endDate: string;
  images: string[];
  isFeatured?: boolean;
  store: Store;
  createdAt: string;
  updatedAt: string;
}

export type SortOption = 'newest' | 'expiring' | 'discount';
