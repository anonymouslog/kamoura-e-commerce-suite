import { z } from "zod";
import type { BagItem } from "./cart";
import { formatPrice, storeConfig } from "./store-config";

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
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  note: z.string().trim().max(500).optional(),
});

export type OrderDetails = z.infer<typeof orderSchema>;

export function orderReference(date = new Date()): string {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KMR-${stamp}-${rand}`;
}

export function shippingCost(method: OrderDetails["shippingMethod"]): number {
  return storeConfig.shipping.find((s) => s.id === method)?.cost ?? 0;
}

export function buildOrderMessage(args: {
  reference: string;
  details: OrderDetails;
  items: BagItem[];
  subtotal: number;
}): string {
  const { reference, details, items, subtotal } = args;
  const ship = storeConfig.shipping.find((s) => s.id === details.shippingMethod);
  const total = subtotal + (ship?.cost ?? 0);

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
    `Shipping (${ship?.label ?? "—"}): ${formatPrice(ship?.cost ?? 0)}`,
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
