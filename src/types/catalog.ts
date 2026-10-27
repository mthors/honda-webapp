import type { Json } from './database';

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface CatalogModelSummary {
  id: string;
  name: string;
  slug: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  shortDescription: string | null;
  engineCc: number | null;
  transmission: string | null;
  isFeatured: boolean;
  isNew: boolean;
  primaryImage: {
    storagePath: string;
    altText: string;
  } | null;
  startingPriceIdr: number | null;
}

export interface VariantColorItem {
  id: string;
  colorId: string;
  name: string;
  slug: string;
  hexCode: string | null;
  imagePath: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface CatalogVariant {
  id: string;
  modelId: string;
  name: string;
  code: string | null;
  description: string | null;
  sortOrder: number;
  priceIdr: number | null;
  colors: VariantColorItem[];
}

export interface CatalogModelImage {
  id: string;
  storagePath: string;
  altText: string;
  imageRole: 'hero' | 'card' | 'gallery' | 'color';
  sortOrder: number;
  variantId: string | null;
  colorId: string | null;
}

export interface CatalogModelDetail {
  id: string;
  name: string;
  slug: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  shortDescription: string | null;
  description: string | null;
  engineCc: number | null;
  transmission: string | null;
  keySpecs: Record<string, Json>;
  isFeatured: boolean;
  isNew: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  images: CatalogModelImage[];
  variants: CatalogVariant[];
  startingPriceIdr: number | null;
}
