import { describe, expect, it } from "vitest";
import { mapProduct, type ProductRow } from "@/lib/catalog";

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
});
