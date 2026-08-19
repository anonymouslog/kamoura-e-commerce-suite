import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { storeConfig } from "@/lib/store-config";

const search = z.object({
  ref: z.string().optional(),
  via: z.enum(["whatsapp", "email"]).optional(),
});

export const Route = createFileRoute("/checkout/success")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Order placed — Kamoura" },
      {
        name: "description",
        content:
          "Your Kamoura order has been sent to the studio. We confirm payment and delivery personally.",
      },
      { property: "og:title", content: "Order placed — Kamoura" },
      { property: "og:description", content: "Your order is with the studio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Success,
});

function Success() {
  const { ref, via } = Route.useSearch();

  return (
    <div className="mx-auto max-w-xl px-5 py-28 text-center sm:px-8">
      <div className="rule-gold mx-auto w-20" />
      <h1 className="mt-8 font-display text-4xl text-ivory">Your order is with us</h1>
      {ref && (
        <p className="numeral mt-4 text-sm text-gold">
          Reference {ref}
        </p>
      )}
      <p className="mt-6 text-sm leading-relaxed text-grey">
        {via === "email"
          ? "An email draft was opened with your order details — send it and we will reply to confirm."
          : "A WhatsApp message was opened with your order details — send it and we will reply to confirm."}{" "}
        If the window didn&apos;t open, write to us on{" "}
        <span className="numeral text-ivory">+{storeConfig.whatsappNumber}</span> or{" "}
        <span className="text-ivory">{storeConfig.orderEmail}</span> quoting the reference above.
      </p>
      <p className="mt-4 text-sm text-grey">
        We confirm stock and total, then share payment and delivery details. Nothing is charged
        automatically.
      </p>
      <Link
        to="/shop"
        className="mt-10 inline-block border border-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
      >
        Keep looking
      </Link>
    </div>
  );
}
