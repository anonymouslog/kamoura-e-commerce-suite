/**
 * Order routing configuration.
 *
 * No payment provider is wired up: a placed order is delivered to the store
 * owner as a WhatsApp message (preferred) or an email draft (fallback).
 * Replace the placeholders below when the real destinations are available.
 */
export const storeConfig = {
  brand: "Kamoura",
  // Full international format, digits only. Example: "2348012345678".
  whatsappNumber: "2348000000000",
  // Gmail address that receives orders when WhatsApp is unavailable.
  orderEmail: "orders@kamoura.example",
  currency: { code: "NGN", symbol: "\u20a6" },
  shipping: [
    { id: "standard", label: "Standard — 3–5 working days", cost: 4500 },
    { id: "express", label: "Express — 1–2 working days", cost: 9500 },
    { id: "pickup", label: "Collect from the Lagos atelier", cost: 0 },
  ],
} as const;

export type ShippingMethodId = (typeof storeConfig.shipping)[number]["id"];

export function formatPrice(amount: number): string {
  return `${storeConfig.currency.symbol}${amount.toLocaleString("en-NG")}`;
}
