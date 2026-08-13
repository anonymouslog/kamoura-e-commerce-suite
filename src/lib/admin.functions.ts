import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  image_url: z.string().trim().url().max(600).nullish(),
  status: z.enum(["draft", "active", "archived"]),
  is_featured: z.boolean(),
});

async function assertAdmin(supabase: {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => Promise<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Admins only.");
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase
      .from("products")
      .upsert({ ...data, image_url: data.image_url ?? null }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
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

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
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
