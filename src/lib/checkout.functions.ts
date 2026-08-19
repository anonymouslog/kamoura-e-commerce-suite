import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { bearerFromRequest, publicServerClient } from "./supabase-public.server";

const itemInput = z.object({
  slug: z.string().min(1).max(120),
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  quantity: z.number().int().min(1).max(10),
});

const orderInput = z.object({
  channel: z.enum(["whatsapp", "email"]),
  contact_name: z.string().trim().min(2).max(120),
  contact_phone: z.string().trim().min(5).max(40),
  contact_email: z.string().trim().email().max(160),
  shipping_method: z.enum(["standard", "express", "pickup"]),
  customer_note: z.string().trim().max(500).optional(),
  address: z.object({
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postal_code: z.string().trim().max(20).optional(),
    country: z.string().trim().min(2).max(80),
  }),
  items: z.array(itemInput).min(1).max(40),
});

function requestKey(request: Request | undefined): string {
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request?.headers.get("x-real-ip") || "unknown";
  const salt = process.env["CHECKOUT_RATE_LIMIT_SALT"];
  if (!salt) throw new Error("Checkout is not configured. Set CHECKOUT_RATE_LIMIT_SALT.");
  return createHash("sha256").update(`${salt}:${address}`).digest("hex");
}

/**
 * Creates an order through the service-role-only database RPC. The browser can
 * submit delivery choices and variants, never money values or stock changes.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .validator((input) => orderInput.parse(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const token = bearerFromRequest(request?.headers);
    let userId: string | null = null;

    if (token) {
      const userClient = publicServerClient(token);
      const { data: userData, error } = await userClient.auth.getUser(token);
      if (error || !userData.user) throw new Error("Your session has expired. Please sign in again.");
      userId = userData.user.id;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc("create_checkout_order", {
      p_user_id: userId,
      p_channel: data.channel,
      p_contact_name: data.contact_name,
      p_contact_phone: data.contact_phone,
      p_contact_email: data.contact_email,
      p_shipping_method: data.shipping_method,
      p_customer_note: data.customer_note ?? null,
      p_shipping_address: data.address,
      p_items: data.items,
      p_request_key: requestKey(request),
    });
    if (error) throw new Error(error.message);

    const order = Array.isArray(result) ? result[0] : result;
    if (!order?.id || !order.reference) throw new Error("Order creation did not return a confirmation.");

    const { data: orderItems, error: itemError } = await supabaseAdmin
      .from("order_items")
      .select("product_name,variant_label,quantity,unit_price_at_purchase,image_url")
      .eq("order_id", order.id)
      .order("id");
    if (itemError) throw new Error(itemError.message);

    let notificationDelivered = false;
    try {
      const { notifyOrder } = await import("@/lib/order-notifications.server");
      const delivery = await notifyOrder({
        id: order.id as string,
        reference: order.reference as string,
        channel: data.channel,
        contactName: data.contact_name,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        shippingMethod: data.shipping_method,
        shippingAddress: data.address,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shipping_cost),
        total: Number(order.total),
        items: (orderItems ?? []).map((item) => {
          const [size = "", color = ""] = item.variant_label.split(" / ");
          return {
            name: item.product_name,
            size,
            color,
            quantity: item.quantity,
            price: Number(item.unit_price_at_purchase),
          };
        }),
      });
      notificationDelivered = delivery.delivered;
    } catch (notificationError) {
      console.error("Order notification failed:", notificationError);
    }

    return {
      id: order.id as string,
      reference: order.reference as string,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      total: Number(order.total),
      notificationDelivered,
      items: (orderItems ?? []).map((item) => {
        const [size = "", color = ""] = item.variant_label.split(" / ");
        return {
          name: item.product_name,
          size,
          color,
          quantity: item.quantity,
          price: Number(item.unit_price_at_purchase),
          image: item.image_url,
        };
      }),
    };
  });
