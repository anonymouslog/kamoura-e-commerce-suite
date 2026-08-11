import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

/**
 * Static catalog stand-in. The shape mirrors the Supabase schema in
 * supabase/schema.sql (products + product_variants + product_images), so
 * swapping this module for real queries later is a drop-in change.
 */
export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  description: string;
  details: string[];
  sizes: string[];
  colors: string[];
  image: string;
  featured?: boolean;
  stock: number;
};

export type CategorySlug = "outerwear" | "knitwear" | "shirting" | "trousers";

export const categories: { slug: CategorySlug; name: string; blurb: string }[] = [
  { slug: "outerwear", name: "Outerwear", blurb: "Coats cut long and unhurried." },
  { slug: "knitwear", name: "Knitwear", blurb: "Cashmere and merino, nothing louder." },
  { slug: "shirting", name: "Shirting", blurb: "Silk and poplin, softly structured." },
  { slug: "trousers", name: "Trousers", blurb: "Wool tailoring with a clean break." },
];

export const products: Product[] = [
  {
    slug: "atlas-wool-overcoat",
    name: "Atlas Wool Overcoat",
    category: "outerwear",
    price: 389000,
    description:
      "A single-breasted overcoat in double-faced Italian wool, cut a little longer than the body asks for. Unlined shoulders keep the drape quiet.",
    details: ["92% virgin wool, 8% cashmere", "Horn buttons", "Made in Portugal"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Charcoal"],
    image: p4,
    featured: true,
    stock: 6,
  },
  {
    slug: "lune-silk-shirt",
    name: "Lune Silk Shirt",
    category: "shirting",
    price: 148000,
    description:
      "Sand-washed silk with a relaxed collar and a slightly dropped shoulder. It creases; that is the point.",
    details: ["100% mulberry silk", "Mother-of-pearl buttons", "Cold hand wash"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Bone"],
    image: p1,
    featured: true,
    stock: 11,
  },
  {
    slug: "meridian-cashmere-knit",
    name: "Meridian Cashmere Knit",
    category: "knitwear",
    price: 212000,
    description:
      "Grade-A Mongolian cashmere knitted at a mid gauge, with a rib collar that holds its shape through the season.",
    details: ["100% cashmere", "Mid-gauge knit", "Made in Scotland"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel", "Fog"],
    image: p3,
    featured: true,
    stock: 9,
  },
  {
    slug: "solstice-wool-trouser",
    name: "Solstice Wool Trouser",
    category: "trousers",
    price: 164000,
    description:
      "A high-rise trouser in tropical wool with a single forward pleat and a full break at the ankle.",
    details: ["Tropical wool", "Hook-and-bar closure", "Unfinished hem on request"],
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Charcoal", "Black"],
    image: p2,
    featured: true,
    stock: 14,
  },
  {
    slug: "harbour-poplin-shirt",
    name: "Harbour Poplin Shirt",
    category: "shirting",
    price: 96000,
    description:
      "Compact cotton poplin, cut boxy through the body. The everyday shirt in the house rotation.",
    details: ["Egyptian cotton poplin", "Single-needle side seams"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory"],
    image: p1,
    stock: 22,
  },
  {
    slug: "nocturne-tailored-trouser",
    name: "Nocturne Tailored Trouser",
    category: "trousers",
    price: 178000,
    description:
      "A narrower cousin to the Solstice, in a matte wool that reads almost black under most light.",
    details: ["Super 110s wool", "Flat front", "Made in Italy"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Black"],
    image: p2,
    stock: 7,
  },
  {
    slug: "vesper-merino-crew",
    name: "Vesper Merino Crew",
    category: "knitwear",
    price: 118000,
    description: "Fine merino with a close crew neck — the layer that disappears under a coat.",
    details: ["Extra-fine merino", "Fully fashioned sleeves"],
    sizes: ["S", "M", "L"],
    colors: ["Camel", "Black"],
    image: p3,
    stock: 0,
  },
  {
    slug: "eclipse-belted-coat",
    name: "Eclipse Belted Coat",
    category: "outerwear",
    price: 425000,
    description:
      "A wrap coat with a self belt and no visible closure, in a brushed wool that softens with wear.",
    details: ["Brushed wool blend", "Self belt", "Made in Portugal"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Black"],
    image: p4,
    stock: 4,
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const byCategory = (slug: string) => products.filter((p) => p.category === slug);

export const featured = () => products.filter((p) => p.featured);

export const related = (slug: string, category: string) =>
  products.filter((p) => p.category === category && p.slug !== slug).slice(0, 3);

export const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)));
export const allColors = Array.from(new Set(products.flatMap((p) => p.colors)));
