/**
 * Wire types for the public site.
 *
 * These MUST stay in sync with the NestJS backend DTOs
 * (`zag-offers-backend/prisma/schema.prisma`). When a field name differs,
 * the UI silently renders `undefined` — always verify against a live
 * `/api/...` response before adding a field here.
 */

/** Minimal category reference embedded inside other resources. */
export interface CategorySummary {
  id?: string;
  name: string;
}

export interface Category extends CategorySummary {
  id: string;
  description?: string;
  icon?: string;
  image?: string;
  priority?: number;
}

export interface Store {
  id: string;
  name: string;
  logo?: string | null;
  area?: string | null;
  address?: string;
  phone?: string;
  whatsapp?: string | null;
  locationUrl?: string | null;
  categoryId?: string;
  category?: CategorySummary;
  coverImage?: string | null;
  images?: string[];
  status?: string;
  workingHours?: unknown;
  ratingAvg?: number;
  ratingCount?: number;
  lat?: number | null;
  lng?: number | null;
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
  /** Present on `/offers/:id`, omitted from the `/offers` list projection. */
  description?: string;
  discount: string;
  originalPrice?: number | null;
  /**
   * Final price after the discount.
   * Backend/Prisma field name is `newPrice` — NOT `discountedPrice`.
   */
  newPrice?: number | null;
  startDate?: string;
  endDate: string;
  images: string[];
  terms?: string | null;
  usageLimit?: number | null;
  minSpend?: number | null;
  discountType?: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string | null;
  views?: number;
  status?: string;
  store: Store;
  createdAt?: string;
  updatedAt?: string;
  _count?: { coupons?: number };
}

/** Coupon lifecycle, mirrors the backend `CouponStatus` enum. */
export type CouponStatus = 'GENERATED' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface Coupon {
  id: string;
  code: string;
  status: CouponStatus;
  expiresAt: string;
  redeemedAt?: string | null;
  createdAt: string;
  offer?: Pick<Offer, 'id' | 'title' | 'discount' | 'images' | 'newPrice' | 'originalPrice'> & {
    store?: { id: string; name: string; phone?: string; whatsapp?: string | null; logo?: string | null };
  };
}

export type SortOption = 'newest' | 'expiring' | 'discount';
