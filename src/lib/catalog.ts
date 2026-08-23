import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

/**
 * Catalogue shapes. Product data now lives in the database; this module holds
 * the client-safe types, the image resolution, and the small static lists the
 * navigation and filters need.
 */
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  details: string[];
  sizes: string[];
  colors: string[];
  image: string;
  featured?: boolean;
  stock: number;
};

export type ProductRow = {
  id?: string;
  slug: string;
  name: string;
  category_slug: string;
  base_price: number | string;
  price?: number | string;
  description: string | null;
  details: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  image_key: string | null;
  image_url: string | null;
  featured?: boolean;
  is_featured?: boolean;
  status?: "draft" | "active" | "archived";
};

const bundledImages: Record<string, string> = { p1, p2, p3, p4 };

export function productImage(row: Pick<ProductRow, "image_key" | "image_url">): string {
  if (row.image_url) return row.image_url;
  return (row.image_key && bundledImages[row.image_key]) || p1;
}

export function normalizePrice(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dedupeGalleryImages(images: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      images
        .filter((image): image is string => Boolean(image && image.trim()))
        .map((image) => image.trim()),
    ),
  );
}

export function mapProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    price: normalizePrice(row.price ?? row.base_price),
    description: row.description ?? "",
    details: Array.isArray(row.details) ? row.details.filter(Boolean) : [],
    sizes: Array.isArray(row.sizes) ? row.sizes.filter(Boolean) : [],
    colors: Array.isArray(row.colors) ? row.colors.filter(Boolean) : [],
    image: productImage(row),
    featured: row.featured ?? row.is_featured ?? false,
    stock: Number.isFinite(Number(row.stock)) ? Number(row.stock) : 0,
  };
}

export type CategorySlug = "outerwear" | "knitwear" | "shirting" | "trousers";

export type CategoryRow = {
  slug: string;
  name: string;
  blurb: string | null;
  sort_order: number | null;
};

export const defaultCategories: { slug: string; name: string; blurb: string }[] = [
  { slug: "outerwear", name: "Outerwear", blurb: "Coats cut long and unhurried." },
  { slug: "knitwear", name: "Knitwear", blurb: "Cashmere and merino, nothing louder." },
  { slug: "shirting", name: "Shirting", blurb: "Silk and poplin, softly structured." },
  { slug: "trousers", name: "Trousers", blurb: "Wool tailoring with a clean break." },
];

export const categories = defaultCategories;

const categoryAliases: Record<string, string> = {
  shirts: "shirting",
  shirt: "shirting",
};

export const getCategory = (slug: string) => {
  const canonicalSlug = categoryAliases[slug] ?? slug;
  return categories.find((c) => c.slug === canonicalSlug);
};

export const allSizes = ["XS", "S", "M", "L", "XL", "28", "30", "32", "34", "36"];
export const allColors = ["Black", "Charcoal", "Ivory", "Bone", "Camel", "Fog"];
