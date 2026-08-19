import { queryOptions } from "@tanstack/react-query";
import { getProductBySlug, listProducts } from "./catalog.functions";
import { mapProduct, type ProductRow } from "./catalog";

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
