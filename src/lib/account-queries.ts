import { queryOptions } from "@tanstack/react-query";
import { getMyAccount, listMyAddresses, listMyOrders, listMyWishlist } from "./account.functions";

export type AccountData = {
  email: string | null;
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    marketing_opt_in: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  roles: string[];
  last_sign_in_at: string | null;
};

export type WishlistItem = {
  id: string;
  product_slug: string;
  created_at: string;
  products: {
    name: string;
    price: number;
    image_key: string | null;
    image_url: string | null;
  } | null;
};

export type AccountAddressRow = {
  id: string;
  user_id: string;
  recipient_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  label: string | null;
  phone: string | null;
  created_at: string;
};

export type AccountOrderRow = {
  id: string;
  reference: string;
  status: string;
  total: number;
  created_at: string;
  tracking_url?: string | null;
  order_items?: Array<{
    id: string;
    product_name: string;
    variant_label: string;
    quantity: number;
    unit_price_at_purchase: number;
    price?: number;
  }>;
};

export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: async () => (await getMyAccount()) as AccountData,
  staleTime: 30_000,
});

export const addressesQuery = queryOptions({
  queryKey: ["account", "addresses"],
  queryFn: async () => (await listMyAddresses()) as unknown as AccountAddressRow[],
  staleTime: 30_000,
});

export const ordersQuery = queryOptions({
  queryKey: ["account", "orders"],
  queryFn: async () => (await listMyOrders()) as unknown as AccountOrderRow[],
  staleTime: 30_000,
});

export const wishlistQuery = queryOptions({
  queryKey: ["account", "wishlist"],
  queryFn: async () => (await listMyWishlist()) as unknown as WishlistItem[],
  staleTime: 30_000,
});
