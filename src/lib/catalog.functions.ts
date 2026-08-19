import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { defaultProducts, readLocalProducts } from "@/lib/cms-store";

const SELECT =
  "id,slug,name,category_slug,price:base_price,description,details,status,featured:is_featured,stock,image_key,image_url,created_at,updated_at";

function hasSupabaseConfig() {
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_PUBLISHABLE_KEY"]);
}

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to your environment.",
    );
  }

  return createClient<Database>(url, key, {
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
  if (!hasSupabaseConfig()) {
    return readLocalProducts().filter((product) => product.status === "active");
  }

  try {
    const { data, error } = await publicClient()
      .from("products")
      .select(SELECT)
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch (error) {
    console.warn("Catalog query skipped while Supabase is not configured:", error);
    return readLocalProducts().filter((product) => product.status === "active");
  }
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    if (!hasSupabaseConfig()) {
      const row = readLocalProducts().find(
        (product) => product.slug === data.slug && product.status === "active",
      );
      return row ?? null;
    }

    try {
      const { data: row, error } = await publicClient()
        .from("products")
        .select(SELECT)
        .eq("status", "active")
        .eq("slug", data.slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return row ?? null;
    } catch (error) {
      console.warn("Product lookup skipped while Supabase is not configured:", error);
      const row = readLocalProducts().find(
        (product) => product.slug === data.slug && product.status === "active",
      );
      return row ?? null;
    }
  });
