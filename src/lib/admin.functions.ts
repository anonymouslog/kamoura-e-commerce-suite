import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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
  original_slug: z.string().trim().min(2).max(120).optional(),
  price: z
    .number()
    .finite()
    .min(0)
    .max(9_999_999_999.99)
    .refine(
      (value) => Math.abs(value - Number(value.toFixed(2))) < 1e-9,
      "Price can have at most two decimal places.",
    ),
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

const productImageBucket = "product-images";
const imageKeyInput = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^products\/[a-z0-9-]+\.(?:jpe?g|png|webp|avif)$/i, "Invalid product image key.");

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Admins only.");
}

export const adminListCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("categories")
      .select("slug,name,blurb,sort_order")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        slug: z
          .string()
          .trim()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes."),
        name: z.string().trim().min(2).max(80),
        blurb: z.string().trim().max(240).default(""),
        sort_order: z.number().int().min(0).max(999).default(0),
        original_slug: z.string().trim().min(2).max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const values = {
      slug: data.slug,
      name: data.name,
      blurb: data.blurb,
      sort_order: data.sort_order,
    };
    if (data.original_slug) {
      const { data: updated, error } = await context.supabase
        .from("categories")
        .update(values)
        .eq("slug", data.original_slug)
        .select("slug")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Collection not found.");
    } else {
      const { error } = await context.supabase.from("categories").insert(values);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
    const { data: categoryRows, error: categoryError } = await context.supabase
      .from("categories")
      .select("slug")
      .eq("slug", data.category_slug)
      .maybeSingle();
    if (categoryError) throw new Error(categoryError.message);
    if (!categoryRows) {
      throw new Error("Unknown collection.");
    }
    const { data: current, error: currentError } = await context.supabase
      .from("products")
      .select("image_key")
      .eq("slug", data.original_slug ?? data.slug)
      .maybeSingle();
    if (currentError) throw new Error(currentError.message);

    const values = {
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
    };
    const result = data.original_slug
      ? await context.supabase
          .from("products")
          .update(values)
          .eq("slug", data.original_slug)
          .select("id")
          .maybeSingle()
      : await context.supabase.from("products").insert(values);
    const { data: savedProduct, error } = result;
    if (error) throw new Error(error.message);
    if (data.original_slug && !savedProduct) throw new Error("Product not found.");

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
    await assertAdmin(context.supabase, context.userId);

    let imageCleanupWarning: string | null = null;
    if (data.slug) {
      const { data: updated, error } = await context.supabase
        .from("products")
        .update({ image_key: null, image_url: null })
        .eq("slug", data.slug)
        .eq("image_key", data.image_key)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("The product image has changed. Refresh and try again.");
    }
    const { error: storageError } = await context.supabase.storage
      .from(productImageBucket)
      .remove([data.image_key]);
    if (storageError) {
      imageCleanupWarning = storageError.message;
    }

    return { ok: true, imageCleanupWarning };
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ slug: z.string().min(1).max(120), status: z.enum(["draft", "active", "archived"]) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
    const { data: product, error: readError } = await context.supabase
      .from("products")
      .select("image_key")
      .eq("slug", data.slug)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!product) throw new Error("Product not found.");

    const { error } = await context.supabase.from("products").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    let imageCleanupWarning: string | null = null;
    if (product.image_key) {
      const { error: storageError } = await context.supabase.storage
        .from(productImageBucket)
        .remove([product.image_key]);
      if (storageError) imageCleanupWarning = storageError.message;
    }
    return { ok: true, imageCleanupWarning };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users: Array<{
      id: string;
      email: string | null;
      name: string | null;
      created_at: string;
      confirmed: boolean;
      role: string | null;
    }> = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      const authUsers = data.users;
      if (authUsers.length === 0) break;
      const ids = authUsers.map((user) => user.id);
      const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] =
        await Promise.all([
          supabaseAdmin.from("profiles").select("id,full_name").in("id", ids),
          supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids),
        ]);
      if (profileError) throw new Error(profileError.message);
      if (roleError) throw new Error(roleError.message);
      const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
      const userRoles = new Map((roles ?? []).map((role) => [role.user_id, role.role]));
      users.push(
        ...authUsers.map((user) => ({
          id: user.id,
          email: user.email ?? null,
          name:
            names.get(user.id) ??
            (typeof user.user_metadata["full_name"] === "string"
              ? user.user_metadata["full_name"]
              : null),
          created_at: user.created_at,
          confirmed: Boolean(user.email_confirmed_at),
          role: userRoles.get(user.id) ?? null,
        })),
      );
      if (authUsers.length < 1000) break;
    }
    return users;
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("newsletter_signups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
