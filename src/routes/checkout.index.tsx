import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import {
  buildOrderMessage,
  mailtoUrl,
  orderReference,
  orderSchema,
  shippingCost,
  whatsappUrl,
  type OrderDetails,
} from "@/lib/order";
import { formatPrice, storeConfig } from "@/lib/store-config";

export const Route = createFileRoute("/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout — Kamoura" },
      {
        name: "description",
        content:
          "Enter delivery details and place your Kamoura order. Orders are sent to the studio on WhatsApp or email for confirmation.",
      },
      { property: "og:title", content: "Checkout — Kamoura" },
      { property: "og:description", content: "Delivery details and order review." },
    ],
  }),
  component: Checkout,
});

type Errors = Partial<Record<keyof OrderDetails, string>>;

const empty: OrderDetails = {
  fullName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
  shippingMethod: "standard",
  note: "",
};

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<OrderDetails>(empty);
  const [errors, setErrors] = useState<Errors>({});

  const shipping = shippingCost(form.shippingMethod);
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-3xl text-ivory">There is nothing to check out yet</h1>
        <p className="mt-4 text-sm text-grey">
          Add a piece to your bag and the delivery form will be waiting here.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block border border-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  const set = (key: keyof OrderDetails) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }) as OrderDetails);
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const place = (channel: "whatsapp" | "email") => {
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof OrderDetails] = issue.message;
      }
      setErrors(next);
      toast.error("A few details still need checking.");
      return;
    }

    const reference = orderReference();
    const message = buildOrderMessage({ reference, details: parsed.data, items, subtotal });
    const url = channel === "whatsapp" ? whatsappUrl(message) : mailtoUrl(reference, message);

    window.open(url, "_blank", "noopener,noreferrer");
    clear();
    void navigate({ to: "/checkout/success", search: { ref: reference, via: channel } });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl text-ivory">Checkout</h1>
      <p className="mt-3 max-w-lg text-sm text-grey">
        No card details are collected. When you place the order, it opens a prepared message to the
        studio — send it and we confirm payment and delivery with you.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-5">
            <legend className="eyebrow">Who we are shipping to</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Full name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
              <Input label="Phone (WhatsApp)" value={form.phone} onChange={set("phone")} error={errors.phone} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="eyebrow">Delivery address</legend>
            <Input label="Address line 1" value={form.line1} onChange={set("line1")} error={errors.line1} />
            <Input
              label="Address line 2 (optional)"
              value={form.line2 ?? ""}
              onChange={set("line2")}
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <Input label="City" value={form.city} onChange={set("city")} error={errors.city} />
              <Input label="State" value={form.state} onChange={set("state")} error={errors.state} />
              <Input
                label="Postal code"
                value={form.postalCode ?? ""}
                onChange={set("postalCode")}
              />
            </div>
            <Input label="Country" value={form.country} onChange={set("country")} error={errors.country} />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="eyebrow">Shipping method</legend>
            {storeConfig.shipping.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-4 text-sm transition-colors ${
                  form.shippingMethod === s.id
                    ? "border-gold text-ivory"
                    : "border-border text-grey hover:border-gold-soft"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={s.id}
                    checked={form.shippingMethod === s.id}
                    onChange={() => set("shippingMethod")(s.id)}
                    className="accent-[var(--color-gold)]"
                  />
                  {s.label}
                </span>
                <span className="numeral text-silver">
                  {s.cost === 0 ? "Free" : formatPrice(s.cost)}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend className="eyebrow">Anything we should know</legend>
            <textarea
              rows={4}
              value={form.note ?? ""}
              onChange={(e) => set("note")(e.target.value)}
              placeholder="Delivery timing, gift wrapping, sizing worries…"
              className="mt-4 w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-grey-dim focus:border-gold focus:outline-none"
            />
          </fieldset>
        </form>

        <aside className="h-fit border border-border bg-bg-soft p-7 lg:sticky lg:top-24">
          <h2 className="eyebrow">Order review</h2>
          <ul className="mt-6 space-y-4 border-b border-border pb-6">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-4 text-sm">
                <span className="text-grey">
                  <span className="text-ivory">{i.name}</span>
                  <br />
                  <span className="text-xs uppercase tracking-[0.14em] text-grey-dim">
                    {i.size} / {i.color} × {i.quantity}
                  </span>
                </span>
                <span className="numeral text-silver">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-grey">Subtotal</dt>
              <dd className="numeral text-silver">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-grey">Shipping</dt>
              <dd className="numeral text-silver">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-xs uppercase tracking-[0.18em] text-grey">Total</span>
            <span className="numeral text-lg text-gold">{formatPrice(total)}</span>
          </div>

          <button
            type="button"
            onClick={() => place("whatsapp")}
            className="mt-7 w-full border border-gold bg-gold px-7 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory"
          >
            Place order on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => place("email")}
            className="mt-3 w-full border border-border px-7 py-4 text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-gold-soft"
          >
            Place order by email
          </button>
        </aside>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  type?: string | undefined;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-[0.7rem] uppercase tracking-[0.18em] text-grey">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`mt-2 w-full border bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-grey-dim focus:outline-none ${
          error ? "border-destructive" : "border-input focus:border-gold"
        }`}
      />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
