import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addressInput = z.object({
  label: z.string().trim().max(60).optional(),
  recipient_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  line1: z.string().trim().min(4).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(80),
  is_default: z.boolean().optional(),
});

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, roles, user] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.auth.getUser(),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    return {
      email: user.data.user?.email ?? null,
      profile: profile.data,
      roles: (roles.data ?? []).map((r) => r.role as string),
      last_sign_in_at: user.data.user?.last_sign_in_at ?? null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        full_name: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(40).optional(),
        marketing_opt_in: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => addressInput.parse(input))
  .handler(async ({ context, data }) => {
    if (data.is_default) {
      const { error: clearError } = await context.supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", context.userId)
        .eq("is_default", true);
      if (clearError) throw new Error(clearError.message);
    }
    const { error } = await context.supabase
      .from("addresses")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("addresses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*), order_events(status,note,created_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist_items")
      .select("id,product_slug,created_at,products(name,price:base_price,image_key,image_url)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ context, data }) => {
    const existing = await context.supabase
      .from("wishlist_items")
      .select("id")
      .eq("product_slug", data.slug)
      .maybeSingle();
    if (existing.data) {
      const { error } = await context.supabase
        .from("wishlist_items")
        .delete()
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }
    const { error } = await context.supabase
      .from("wishlist_items")
      .insert({ user_id: context.userId, product_slug: data.slug });
    if (error) throw new Error(error.message);
    return { saved: true };
  });
