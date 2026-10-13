import { queryOptions } from "@tanstack/react-query";
import { getShippingConfiguration } from "./shipping.functions";

export const shippingConfigurationQuery = queryOptions({
  queryKey: ["shipping-configuration"],
  queryFn: async () => await getShippingConfiguration(),
  staleTime: 30_000,
});
