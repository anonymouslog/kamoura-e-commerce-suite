import { z } from "zod";
import { formatPrice, storeConfig } from "./store-config";
import { shippingMethodLabel } from "./shipping";

/** Shared between the checkout form and the order-message builder. */
export const orderSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us who the order is for."),
  phone: z
    .string()
    .trim()
    .min(7, "A reachable phone number, please — we confirm every order by call or message."),
  email: z.string().trim().email("That email doesn't look right."),
  line1: z.string().trim().min(4, "Street address is required."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().min(2, "Country is required."),
  shippingMethod: z.enum(["same_state", "interstate_waybill"]),
  note: z.string().trim().max(500).optional(),
});

export type OrderDetails = z.infer<typeof orderSchema>;

export function buildOrderMessage(args: {
  reference: string;
  details: OrderDetails;
  items: Array<{ name: string; size: string; color: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  total: number;
}): string {
  const { reference, details, items, subtotal, shipping, total } = args;
  const lines = [
    `KAMOURA — new order ${reference}`,
    "",
    "Items",
    ...items.map(
      (i) =>
        `• ${i.name} — ${i.size} / ${i.color} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`,
    ),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    `Shipping (${shippingMethodLabel(details.shippingMethod)}): ${formatPrice(shipping)}`,
    `Total: ${formatPrice(total)}`,
    "",
    "Customer",
    details.fullName,
    details.phone,
    details.email,
    "",
    "Deliver to",
    details.line1,
    ...(details.line2 ? [details.line2] : []),
    `${details.city}, ${details.state}${details.postalCode ? ` ${details.postalCode}` : ""}`,
    details.country,
  ];

  if (details.note) lines.push("", "Note", details.note);

  return lines.join("\n");
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(reference: string, message: string): string {
  return `mailto:${storeConfig.orderEmail}?subject=${encodeURIComponent(
    `Kamoura order ${reference}`,
  )}&body=${encodeURIComponent(message)}`;
}
