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
  slug: string;
  name: string;
  category_slug: string;
  price: number | string;
  description: string | null;
  details: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  image_key: string | null;
  image_url: string | null;
  featured?: boolean;
  is_featured?: boolean;
};

const bundledImages: Record<string, string> = { p1, p2, p3, p4 };

export function productImage(row: Pick<ProductRow, "image_key" | "image_url">): string {
  if (row.image_url) return row.image_url;
  return (row.image_key && bundledImages[row.image_key]) || p1;
}

export function mapProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    price: Number(row.price),
    description: row.description ?? "",
    details: row.details ?? [],
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    image: productImage(row),
    featured: row.featured ?? row.is_featured ?? false,
    stock: row.stock,
  };
}

export const categories: { slug: string; name: string; blurb: string }[] = [
  { slug: "outerwear", name: "Outerwear", blurb: "Coats cut long and unhurried." },
  { slug: "knitwear", name: "Knitwear", blurb: "Cashmere and merino, nothing louder." },
  { slug: "shirting", name: "Shirting", blurb: "Silk and poplin, softly structured." },
  { slug: "trousers", name: "Trousers", blurb: "Wool tailoring with a clean break." },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const allSizes = ["XS", "S", "M", "L", "XL", "28", "30", "32", "34", "36"];
export const allColors = ["Black", "Charcoal", "Ivory", "Bone", "Camel", "Fog"];
