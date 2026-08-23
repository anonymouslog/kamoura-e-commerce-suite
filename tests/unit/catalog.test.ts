import { describe, expect, it } from "vitest";
import { buildCategoryDeleteErrorMessage } from "@/lib/admin.functions";
import { dedupeGalleryImages, getCategory, mapProduct, type ProductRow } from "@/lib/catalog";

describe("catalog module", () => {
  it("maps base_price to price and sets defaults correctly", () => {
    const row: ProductRow = {
      slug: "test-product",
      name: "Test Product",
      category_slug: "outerwear",
      base_price: 150000,
      description: null,
      details: null,
      sizes: null,
      colors: null,
      stock: 5,
      image_key: null,
      image_url: null,
      is_featured: true,
    };

    const product = mapProduct(row);

    expect(product.slug).toBe("test-product");
    expect(product.name).toBe("Test Product");
    expect(product.category).toBe("outerwear");
    expect(product.price).toBe(150000);
    expect(product.description).toBe("");
    expect(product.details).toEqual([]);
    expect(product.sizes).toEqual([]);
    expect(product.colors).toEqual([]);
    expect(product.featured).toBe(true);
    expect(product.stock).toBe(5);
  });

  it("normalizes malformed or missing prices without producing NaN", () => {
    const row: ProductRow = {
      slug: "broken-price",
      name: "Broken Price",
      category_slug: "outerwear",
      base_price: "not-a-number",
      description: "A product",
      details: ["detail"],
      sizes: ["M"],
      colors: ["Black"],
      stock: 2,
      image_key: null,
      image_url: null,
      is_featured: false,
    };

    const product = mapProduct(row);

    expect(Number.isFinite(product.price)).toBe(true);
    expect(product.price).toBe(0);
  });

  it("removes duplicate gallery entries while preserving order", () => {
    expect(dedupeGalleryImages(["/a.jpg", "/a.jpg", "/b.jpg", "/b.jpg"])).toEqual([
      "/a.jpg",
      "/b.jpg",
    ]);
  });

  it("accepts the legacy shirts alias and resolves it to the canonical shirting collection", () => {
    const legacy = getCategory("shirts");
    const canonical = getCategory("shirting");

    expect(legacy).toEqual(canonical);
    expect(legacy?.slug).toBe("shirting");
    expect(legacy?.name).toBe("Shirting");
  });

  it("formats a clear category delete block message when products still reference the category", () => {
    expect(buildCategoryDeleteErrorMessage(3)).toBe(
      "This category has 3 products — reassign or delete them first.",
    );
    expect(buildCategoryDeleteErrorMessage(1)).toBe(
      "This category has 1 product — reassign or delete it first.",
    );
  });
});
