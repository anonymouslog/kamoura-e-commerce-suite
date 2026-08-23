import { queryOptions } from "@tanstack/react-query";
import { adminListProducts, adminListOrders, adminListNewsletter } from "./admin.functions";
import type { ProductRow } from "./catalog";

export type OrderStatusType =
  "placed" | "confirmed" | "paid" | "fulfilled" | "shipped" | "delivered" | "cancelled";

export type AdminOrderItemRow = {
  id: string;
  product_name: string;
  variant_label: string;
  product_slug?: string | null;
  quantity: number;
  unit_price_at_purchase?: number;
  price?: number;
};

export type AdminOrderEventRow = {
  status: string;
  note: string | null;
  created_at: string;
};

export type AdminOrderRow = {
  id: string;
  reference: string;
  status: OrderStatusType;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  customer_note: string | null;
  shipping_address: Record<string, string | null>;
  tracking_url: string | null;
  payment_method?: string | null;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  order_items?: AdminOrderItemRow[];
  order_events?: AdminOrderEventRow[];
};

export type NewsletterSignupRow = {
  id: string;
  email: string;
  created_at: string;
};

export const adminProductsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => (await adminListProducts()) as unknown as ProductRow[],
  staleTime: 30_000,
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async () => (await adminListOrders()) as unknown as AdminOrderRow[],
  staleTime: 30_000,
});

export const adminNewsletterQuery = queryOptions({
  queryKey: ["admin", "newsletter"],
  queryFn: async () => (await adminListNewsletter()) as unknown as NewsletterSignupRow[],
  staleTime: 30_000,
});
