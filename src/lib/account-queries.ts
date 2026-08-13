import { queryOptions } from "@tanstack/react-query";
import {
  getMyAccount,
  listMyAddresses,
  listMyOrders,
  listMyWishlist,
} from "./account.functions";
import {
  adminListNewsletter,
  adminListOrders,
  adminListProducts,
} from "./admin.functions";

export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: () => getMyAccount(),
});
export const addressesQuery = queryOptions({
  queryKey: ["addresses"],
  queryFn: () => listMyAddresses(),
});
export const myOrdersQuery = queryOptions({
  queryKey: ["my-orders"],
  queryFn: () => listMyOrders(),
});
export const wishlistQuery = queryOptions({
  queryKey: ["wishlist"],
  queryFn: () => listMyWishlist(),
});
export const adminProductsQuery = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => adminListProducts(),
});
export const adminOrdersQuery = queryOptions({
  queryKey: ["admin-orders"],
  queryFn: () => adminListOrders(),
});
export const adminNewsletterQuery = queryOptions({
  queryKey: ["admin-newsletter"],
  queryFn: () => adminListNewsletter(),
});
