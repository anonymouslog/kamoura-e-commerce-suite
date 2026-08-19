import type { ProductRow } from "@/lib/catalog";

const CMS_PRODUCTS_KEY = "kamoura-cms-products";

export const defaultProducts: ProductRow[] = [
  {
    slug: "atlas-wool-overcoat",
    name: "Atlas Wool Overcoat",
    category_slug: "outerwear",
    price: 389000,
    description:
      "A single-breasted overcoat in double-faced Italian wool, cut a little longer than the body asks for. Unlined shoulders keep the drape quiet.",
    details: ["92% virgin wool, 8% cashmere", "Horn buttons", "Made in Portugal"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Charcoal"],
    stock: 6,
    image_key: "p4",
    image_url: null,
    is_featured: true,
    status: "active",
    featured: true,
  },
  {
    slug: "lune-silk-shirt",
    name: "Lune Silk Shirt",
    category_slug: "shirting",
    price: 148000,
    description:
      "Sand-washed silk with a relaxed collar and a slightly dropped shoulder. It creases; that is the point.",
    details: ["100% mulberry silk", "Mother-of-pearl buttons", "Cold hand wash"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Bone"],
    stock: 11,
    image_key: "p1",
    image_url: null,
    is_featured: true,
    status: "active",
    featured: true,
  },
  {
    slug: "meridian-cashmere-knit",
    name: "Meridian Cashmere Knit",
    category_slug: "knitwear",
    price: 212000,
    description:
      "Grade-A Mongolian cashmere knitted at a mid gauge, with a rib collar that holds its shape through the season.",
    details: ["100% cashmere", "Mid-gauge knit", "Made in Scotland"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel", "Fog"],
    stock: 9,
    image_key: "p3",
    image_url: null,
    is_featured: true,
    status: "active",
    featured: true,
  },
  {
    slug: "solstice-wool-trouser",
    name: "Solstice Wool Trouser",
    category_slug: "trousers",
    price: 164000,
    description:
      "A high-rise trouser in tropical wool with a single forward pleat and a full break at the ankle.",
    details: ["Tropical wool", "Hook-and-bar closure", "Unfinished hem on request"],
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Charcoal", "Black"],
    stock: 14,
    image_key: "p2",
    image_url: null,
    is_featured: true,
    status: "active",
    featured: true,
  },
  {
    slug: "harbour-poplin-shirt",
    name: "Harbour Poplin Shirt",
    category_slug: "shirting",
    price: 96000,
    description:
      "Compact cotton poplin, cut boxy through the body. The everyday shirt in the house rotation.",
    details: ["Egyptian cotton poplin", "Single-needle side seams"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory"],
    stock: 22,
    image_key: "p1",
    image_url: null,
    is_featured: false,
    status: "active",
    featured: false,
  },
  {
    slug: "nocturne-tailored-trouser",
    name: "Nocturne Tailored Trouser",
    category_slug: "trousers",
    price: 178000,
    description:
      "A narrower cousin to the Solstice, in a matte wool that reads almost black under most light.",
    details: ["Super 110s wool", "Flat front", "Made in Italy"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Black"],
    stock: 7,
    image_key: "p2",
    image_url: null,
    is_featured: false,
    status: "active",
    featured: false,
  },
  {
    slug: "vesper-merino-crew",
    name: "Vesper Merino Crew",
    category_slug: "knitwear",
    price: 118000,
    description: "Fine merino with a close crew neck — the layer that disappears under a coat.",
    details: ["Extra-fine merino", "Fully fashioned sleeves"],
    sizes: ["S", "M", "L"],
    colors: ["Camel", "Black"],
    stock: 0,
    image_key: "p3",
    image_url: null,
    is_featured: false,
    status: "active",
    featured: false,
  },
  {
    slug: "eclipse-belted-coat",
    name: "Eclipse Belted Coat",
    category_slug: "outerwear",
    price: 425000,
    description:
      "A wrap coat with a self belt and no visible closure, in a brushed wool that softens with wear.",
    details: ["Brushed wool blend", "Self belt", "Made in Portugal"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Black"],
    stock: 4,
    image_key: "p4",
    image_url: null,
    is_featured: false,
    status: "active",
    featured: false,
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

export function readLocalProducts(): ProductRow[] {
  if (!isBrowser()) return defaultProducts;

  try {
    const raw = window.localStorage.getItem(CMS_PRODUCTS_KEY);
    if (!raw) return defaultProducts;
    const parsed = JSON.parse(raw) as ProductRow[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function writeLocalProducts(products: ProductRow[]) {
  if (!isBrowser()) return products;
  window.localStorage.setItem(CMS_PRODUCTS_KEY, JSON.stringify(products));
  return products;
}
