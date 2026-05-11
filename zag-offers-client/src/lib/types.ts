export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Store {
  id: string;
  name: string;
  logo?: string;
  area: string;
  address?: string;
  phone?: string;
  categoryId?: string;
  category?: Category;
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
