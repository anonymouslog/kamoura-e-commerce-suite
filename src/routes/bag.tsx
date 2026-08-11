import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store-config";

export const Route = createFileRoute("/bag")({
  head: () => ({
    meta: [
      { title: "Your bag — Kamoura" },
      {
        name: "description",
        content: "Review the pieces in your Kamoura bag, adjust quantities and continue to checkout.",
      },
      { property: "og:title", content: "Your bag — Kamoura" },
      { property: "og:description", content: "Review your selection before placing the order." },
    ],
  }),
  component: Bag,
});

const PROMOS: Record<string, number> = { KAMOURA10: 0.1, STUDIO: 0.05 };

function Bag() {
  const { items, subtotal, setQuantity, remove } = useCart();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-3xl text-ivory">Your bag is empty</h1>
        <p className="mt-4 text-sm text-grey">
          Nothing chosen yet. The new run of coats and knitwear is the place to start.
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

  const discountValue = Math.round(subtotal * discount);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl text-ivory">Your bag</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.key} className="flex gap-5 py-6">
              <Link to="/product/$slug" params={{ slug: item.slug }} className="shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className="h-32 w-24 border border-border object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      className="font-display text-lg text-ivory hover:text-gold"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-grey-dim">
                      {item.size} / {item.color}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="text-grey transition-colors hover:text-ivory"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="px-3 py-2 text-grey hover:text-ivory"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="numeral w-8 text-center text-sm text-ivory">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="px-3 py-2 text-grey hover:text-ivory"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="numeral text-sm text-silver">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-border bg-bg-soft p-7 lg:sticky lg:top-24">
          <h2 className="eyebrow">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {discountValue > 0 && (
              <Row label="Promotion" value={`− ${formatPrice(discountValue)}`} accent />
            )}
            <Row label="Shipping" value="Chosen at checkout" muted />
          </dl>

          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const code = promo.trim().toUpperCase();
              if (PROMOS[code]) {
                setDiscount(PROMOS[code]);
                toast.success(`Code applied — ${PROMOS[code] * 100}% off this order.`);
              } else {
                setDiscount(0);
                toast.error("That code isn't active right now.");
              }
            }}
          >
            <label htmlFor="promo" className="sr-only">
              Promotion code
            </label>
            <input
              id="promo"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promotion code"
              className="flex-1 border border-input bg-transparent px-3 py-2.5 text-sm text-ivory placeholder:text-grey-dim focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="border border-border px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-grey hover:border-gold-soft hover:text-ivory"
            >
              Apply
            </button>
          </form>

          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-xs uppercase tracking-[0.18em] text-grey">Total so far</span>
            <span className="numeral text-lg text-gold">
              {formatPrice(subtotal - discountValue)}
            </span>
          </div>

          <Link
            to="/checkout"
            className="mt-7 block border border-gold bg-gold px-7 py-4 text-center text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory"
          >
            Continue to checkout
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-grey-dim">
            No card is taken online. Your order is sent to the studio on WhatsApp or email, and we
            confirm payment and delivery with you directly.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-grey">{label}</dt>
      <dd
        className={
          accent ? "numeral text-gold" : muted ? "text-xs text-grey-dim" : "numeral text-silver"
        }
      >
        {value}
      </dd>
    </div>
  );
}
