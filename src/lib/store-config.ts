/**
 * Order routing configuration.
 *
 * No payment provider is wired up: a placed order is delivered to the store
 * owner as a WhatsApp message (preferred) or an email draft (fallback).
 * The contact destinations come from env-backed config.
 */
function normalizeWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;

  return digits;
}

const publicContact = {
  phoneDisplay: "08143359771",
  phoneE164: "+2348143359771",
  email: "kamoura595@gmail.com",
  instagram:
    "https://www.instagram.com/kam_oura99?igsh=ejE2eHF6NGR5dXNo&utm_source=qr",
  tiktok: "https://www.tiktok.com/@_kam_oura?_r=1&_t=ZS-98nHzmYaJ09",
} as const;

const orderWhatsApp = import.meta.env["VITE_ORDER_WHATSAPP_NUMBER"] ?? publicContact.phoneE164;
const orderEmail = import.meta.env["VITE_ORDER_EMAIL"] ?? publicContact.email;

export const storeConfig = {
  brand: "Kamoura",
  contact: publicContact,
  whatsappNumber: normalizeWhatsAppNumber(orderWhatsApp),
  orderEmail,
  socials: [
    { label: "Instagram", href: publicContact.instagram },
    { label: "TikTok", href: publicContact.tiktok },
  ] as const,
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
