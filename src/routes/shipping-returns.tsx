import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping-returns")({
  head: () => ({
    meta: [
      { title: "Shipping and Returns — Kamoura" },
      {
        name: "description",
        content: "Shipping timelines, delivery expectations, and returns guidance for Kamoura.",
      },
    ],
  }),
  component: ShippingReturns,
});

function ShippingReturns() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-20 sm:px-8">
      <p className="eyebrow">Fulfilment</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">Shipping and Returns</h1>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-grey">
        <p>
          Orders are confirmed manually before dispatch. Shipping method and cost are shown at
          checkout. Once stock is confirmed, the studio sends the final order details by WhatsApp
          or email.
        </p>
        <p>
          Delivery timing depends on the shipping method selected and the destination. If an item
          is delayed, we contact you with an updated estimate.
        </p>
        <p>
          Returns are handled case by case. For sizing issues or a damaged item, contact the studio
          within a reasonable time after delivery and include your order reference.
        </p>
        <p>
          For all fulfilment questions, use the{" "}
          <Link to="/contact" className="text-ivory underline decoration-gold/40 underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
