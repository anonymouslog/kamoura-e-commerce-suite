import { queryOptions } from "@tanstack/react-query";
import { adminListProducts, adminListOrders, adminListNewsletter } from "./admin.functions";

export const adminProductsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => (await adminListProducts()) as unknown as any[],
  staleTime: 30_000,
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async () => (await adminListOrders()) as unknown as any[],
  staleTime: 30_000,
});

export const adminNewsletterQuery = queryOptions({
  queryKey: ["admin", "newsletter"],
  queryFn: async () => (await adminListNewsletter()) as unknown as any[],
  staleTime: 30_000,
});
