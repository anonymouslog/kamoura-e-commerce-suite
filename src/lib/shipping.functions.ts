import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin.functions";
import { publicServerClient } from "@/lib/supabase-public.server";
import type { ShippingConfiguration } from "./shipping";

const feeInput = z
  .number()
  .finite()
  .min(0)
  .max(999_999_999)
  .refine(
    (value) => Math.abs(value - Number(value.toFixed(2))) < 1e-9,
    "Fees can have at most two decimal places.",
  );

export const getShippingConfiguration = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicServerClient()
    .from("store_shipping_config")
    .select("dispatch_state,same_state_fee,interstate_fee")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ShippingConfiguration | null;
});

export const adminGetShippingConfiguration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("store_shipping_config")
      .select("dispatch_state,same_state_fee,interstate_fee")
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as ShippingConfiguration | null;
  });

export const adminSaveShippingConfiguration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        dispatch_state: z.string().trim().min(2).max(80),
        same_state_fee: feeInput,
        interstate_fee: feeInput,
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("store_shipping_config")
      .upsert({ id: true, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
