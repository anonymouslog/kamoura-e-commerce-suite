import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { categories } from "@/lib/catalog";

const statuses = [
  "placed",
  "confirmed",
  "paid",
  "fulfilled",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const productInput = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only."),
  name: z.string().trim().min(2).max(160),
  category_slug: z.string().trim().min(2).max(80),
  price: z.number().min(0),
  description: z.string().trim().max(2000).default(""),
  details: z.array(z.string().trim().max(200)).max(20).default([]),
  sizes: z.array(z.string().trim().max(12)).max(20).default([]),
  colors: z.array(z.string().trim().max(30)).max(20).default([]),
  stock: z.number().int().min(0).max(100000),
  image_key: z.string().trim().max(120).nullish(),
  image_url: z.string().trim().url().max(600).nullish(),
  status: z.enum(["draft", "active", "archived"]),
  is_featured: z.boolean(),
});

const categorySlugs = new Set(categories.map((category) => category.slug));
const productImageBucket = "product-images";
const imageKeyInput = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^products\/[a-z0-9-]+\.(?:jpe?g|png|webp|avif)$/i, "Invalid product image key.");

export async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (!data?.length) throw new Error("Admins only.");
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "slug,name,category_slug,price:base_price,description,details,sizes,colors,stock,image_key,image_url,status,featured:is_featured,created_at,updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => productInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (!categorySlugs.has(data.category_slug)) {
      throw new Error("Unknown category.");
    }
    const { data: current, error: currentError } = await context.supabase
      .from("products")
      .select("image_key")
      .eq("slug", data.slug)
      .maybeSingle();
    if (currentError) throw new Error(currentError.message);

    const { error } = await context.supabase
      .from("products")
      .upsert(
        {
          slug: data.slug,
          name: data.name,
          category_slug: data.category_slug,
          base_price: data.price,
          description: data.description,
          details: data.details,
          sizes: data.sizes,
          colors: data.colors,
          stock: data.stock,
          image_key: data.image_key || null,
          image_url: data.image_url ?? null,
          status: data.status,
          is_featured: data.is_featured,
        },
        { onConflict: "slug" },
      );
    if (error) throw new Error(error.message);

    const previousImageKey = current?.image_key;
    let imageCleanupWarning: string | null = null;
    if (previousImageKey && previousImageKey !== data.image_key) {
      const { error: storageError } = await context.supabase.storage
        .from(productImageBucket)
        .remove([previousImageKey]);
      if (storageError) imageCleanupWarning = storageError.message;
    }

    return { ok: true, imageCleanupWarning };
  });

export const adminRemoveProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        image_key: imageKeyInput,
        slug: z.string().trim().min(2).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);

    const { error: storageError } = await context.supabase.storage
      .from(productImageBucket)
      .remove([data.image_key]);
    if (storageError) throw new Error(storageError.message);

    if (data.slug) {
      const { error } = await context.supabase
        .from("products")
        .update({ image_key: null, image_url: null })
        .eq("slug", data.slug)
        .eq("image_key", data.image_key);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ slug: z.string().min(1).max(120), status: z.enum(["draft", "active", "archived"]) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase
      .from("products")
      .update({ status: data.status })
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data: product, error: readError } = await context.supabase
      .from("products")
      .select("image_key")
      .eq("slug", data.slug)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!product) throw new Error("Product not found.");

    if (product.image_key) {
      const { error: storageError } = await context.supabase.storage
        .from(productImageBucket)
        .remove([product.image_key]);
      if (storageError) throw new Error(`Product image could not be removed: ${storageError.message}`);
    }

    const { error } = await context.supabase.from("products").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*), order_events(status,note,created_at)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(statuses),
        note: z.string().trim().max(400).optional(),
        tracking_url: z.string().trim().url().max(600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase
      .from("orders")
      .update({
        status: data.status,
        ...(data.tracking_url ? { tracking_url: data.tracking_url } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const evt = await context.supabase
      .from("order_events")
      .insert({ order_id: data.id, status: data.status, note: data.note ?? null });
    if (evt.error) throw new Error(evt.error.message);
    return { ok: true };
  });

export const adminListNewsletter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("newsletter_signups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
