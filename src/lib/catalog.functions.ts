import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const SELECT =
  "slug,name,category_slug,price,description,details,sizes,colors,stock,image_key,image_url,is_featured";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select(SELECT)
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("products")
      .select(SELECT)
      .eq("status", "active")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });
