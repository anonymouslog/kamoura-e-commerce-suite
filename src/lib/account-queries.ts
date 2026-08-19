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

export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: async () => (await getMyAccount()) as AccountData,
  staleTime: 30_000,
});

export const addressesQuery = queryOptions({
  queryKey: ["account", "addresses"],
  queryFn: async () => (await listMyAddresses()) as unknown as any[],
  staleTime: 30_000,
});

export const ordersQuery = queryOptions({
  queryKey: ["account", "orders"],
  queryFn: async () => (await listMyOrders()) as unknown as any[],
  staleTime: 30_000,
});

export const wishlistQuery = queryOptions({
  queryKey: ["account", "wishlist"],
  queryFn: async () => (await listMyWishlist()) as unknown as any[],
  staleTime: 30_000,
});
