import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { bearerFromRequest, publicServerClient } from "./supabase-public.server";

const itemInput = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  size: z.string().max(20),
  color: z.string().max(40),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(10),
  image: z.string().max(1000).optional(),
});

const orderInput = z.object({
  reference: z.string().min(4).max(40),
  channel: z.enum(["whatsapp", "email"]),
  contact_name: z.string().trim().min(2).max(120),
  contact_phone: z.string().trim().min(5).max(40),
  contact_email: z.string().trim().email().max(160),
  shipping_method: z.enum(["standard", "express", "pickup"]),
  shipping_cost: z.number().min(0),
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

/** Saves the order to the database. Works for guests and signed-in users; the
 *  WhatsApp / email hand-off still happens in the browser. */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => orderInput.parse(input))
  .handler(async ({ data }) => {
    const token = bearerFromRequest(getRequest()?.headers);
    const supabase = publicServerClient(token);

    let userId: string | null = null;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData.user?.id ?? null;
    }

    // Stock validation against live catalogue data.
    const slugs = [...new Set(data.items.map((i) => i.slug))];
    const { data: rows, error: stockError } = await publicServerClient()
      .from("products")
      .select("slug,name,stock,price,status")
      .in("slug", slugs);
    if (stockError) throw new Error(stockError.message);

    for (const item of data.items) {
      const row = rows?.find((r) => r.slug === item.slug);
      if (!row || row.status !== "active") {
        throw new Error(`${item.name} is no longer available.`);
      }
      if (row.stock < item.quantity) {
        throw new Error(
          row.stock === 0
            ? `${row.name} just sold out.`
            : `Only ${row.stock} left of ${row.name}. Adjust the quantity.`,
        );
      }
    }

    const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = subtotal + data.shipping_cost;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        reference: data.reference,
        user_id: userId,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        shipping_address: data.address,
        shipping_method: data.shipping_method,
        subtotal,
        shipping_cost: data.shipping_cost,
        total,
        customer_note: data.customer_note ?? null,
        notified_channel: data.channel,
        notified_at: new Date().toISOString(),
      })
      .select("id,reference")
      .single();
    if (error) throw new Error(error.message);

    const items = await supabase.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_slug: i.slug,
        product_name: i.name,
        variant_label: `${i.size} / ${i.color}`,
        quantity: i.quantity,
        unit_price_at_purchase: i.price,
        image_url: i.image ?? null,
      })),
    );
    if (items.error) throw new Error(items.error.message);

    return { id: order.id, reference: order.reference, total };
  });
