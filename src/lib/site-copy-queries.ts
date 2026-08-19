import { queryOptions } from "@tanstack/react-query";
import { getSiteCopy } from "./site-copy.functions";

export const siteCopyQuery = queryOptions({
  queryKey: ["site-copy"],
  queryFn: async () => await getSiteCopy(),
  staleTime: 60_000,
});
