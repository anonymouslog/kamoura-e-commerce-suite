import { queryOptions } from "@tanstack/react-query";
import { getProductBySlug, listCategories, listProducts } from "./catalog.functions";
import { mapProduct, type CategoryRow, type ProductRow } from "./catalog";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => (await listCategories()) as CategoryRow[],
  staleTime: 30_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const rows = (await listProducts()) as ProductRow[];
    return rows.map(mapProduct);
  },
  staleTime: 30_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const row = (await getProductBySlug({ data: { slug } })) as ProductRow | null;
      return row ? mapProduct(row) : null;
    },
    staleTime: 30_000,
  });
