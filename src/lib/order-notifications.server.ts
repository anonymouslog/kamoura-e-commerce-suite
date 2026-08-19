type OrderNotificationItem = {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
};

export type OrderNotificationPayload = {
  id: string;
  reference: string;
  channel: "whatsapp" | "email";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  shippingMethod: string;
  shippingAddress: Record<string, string | null | undefined>;
  subtotal: number;
  shippingCost: number;
  total: number;
  items: OrderNotificationItem[];
};

type DeliveryResult = {
  provider: string;
  status: "sent" | "skipped" | "failed";
  providerMessageId?: string;
  errorMessage?: string;
};

function orderText(order: OrderNotificationPayload): string {
  const lines = order.items.map(
    (item) => `- ${item.name} (${item.size} / ${item.color}) x${item.quantity}: NGN ${item.price * item.quantity}`,
  );
  return [
    `New Kamoura order ${order.reference}`,
    "",
    ...lines,
    "",
    `Subtotal: NGN ${order.subtotal}`,
    `Shipping: NGN ${order.shippingCost}`,
    `Total: NGN ${order.total}`,
    "",
    `${order.contactName} | ${order.contactPhone} | ${order.contactEmail}`,
    `${order.shippingAddress.line1 ?? ""}, ${order.shippingAddress.city ?? ""}, ${order.shippingAddress.state ?? ""}`,
  ].join("\n");
}

async function sendResend(order: OrderNotificationPayload): Promise<DeliveryResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["ORDER_FROM_EMAIL"];
  const to = process.env["ORDER_NOTIFICATION_EMAIL"];
  if (!apiKey || !from || !to) return { provider: "resend", status: "skipped" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New order ${order.reference}`,
        text: orderText(order),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { provider: "resend", status: "failed", errorMessage: payload.message ?? "Email delivery failed." };
    }
    return { provider: "resend", status: "sent", providerMessageId: payload.id };
  } catch (error) {
    return { provider: "resend", status: "failed", errorMessage: error instanceof Error ? error.message : "Email delivery failed." };
  }
}

async function sendWebhook(order: OrderNotificationPayload): Promise<DeliveryResult> {
  const endpoint = process.env["ORDER_NOTIFICATION_WEBHOOK_URL"];
  const secret = process.env["ORDER_NOTIFICATION_WEBHOOK_SECRET"];
  if (!endpoint || !secret) return { provider: "order-webhook", status: "skipped" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kamoura-Webhook-Secret": secret,
      },
      body: JSON.stringify(order),
    });
    if (!response.ok) return { provider: "order-webhook", status: "failed", errorMessage: `Webhook returned ${response.status}.` };
    return { provider: "order-webhook", status: "sent" };
  } catch (error) {
    return { provider: "order-webhook", status: "failed", errorMessage: error instanceof Error ? error.message : "Webhook delivery failed." };
  }
}

export async function notifyOrder(order: OrderNotificationPayload): Promise<{ delivered: boolean }> {
  const deliveries = await Promise.all([sendResend(order), sendWebhook(order)]);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  await admin.from("order_notifications").insert(
    deliveries.map((delivery) => ({
      order_id: order.id,
      channel: order.channel,
      provider: delivery.provider,
      status: delivery.status,
      provider_message_id: delivery.providerMessageId ?? null,
      error_message: delivery.errorMessage ?? null,
    })),
  );

  const delivered = deliveries.some((delivery) => delivery.status === "sent");
  if (delivered) {
    await admin
      .from("orders")
      .update({ notified_channel: order.channel, notified_at: new Date().toISOString() })
      .eq("id", order.id);
  }
  return { delivered };
}
