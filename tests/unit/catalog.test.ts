import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("does not expose collection deletion and blocks database deletes", () => {
    const serverFunctions = readFileSync(
      resolve(process.cwd(), "src/lib/admin.functions.ts"),
      "utf8",
    );
    const adminPage = readFileSync(
      resolve(process.cwd(), "src/routes/admin/collections.tsx"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261013000100_collections_users_shipping.sql"),
      "utf8",
    );

    expect(serverFunctions).not.toContain("adminDeleteCollection");
    expect(serverFunctions).not.toContain("adminDeleteCategory");
    expect(serverFunctions).not.toContain('.from("categories").delete()');
    expect(adminPage).not.toContain("Delete ");
    expect(migration).toContain("create trigger categories_prevent_delete");
    expect(migration).toContain("Collections cannot be deleted.");
  });
});
