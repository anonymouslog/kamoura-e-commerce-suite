import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Kamoura" },
      {
        name: "description",
        content: "Terms for browsing Kamoura, placing orders, and using the account area.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-20 sm:px-8">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">Terms of Service</h1>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-grey">
        <p>
          By using Kamoura, you agree to provide accurate information when placing an order or
          creating an account.
        </p>
        <p>
          Order availability is subject to stock confirmation. No payment is captured automatically
          in this version of the store; final payment instructions are confirmed by the studio
          after review.
        </p>
        <p>
          Product images, descriptions, and availability may change without prior notice. We keep
          the public catalogue accurate, but errors can happen and may be corrected before
          fulfilment.
        </p>
        <p>
          The account and admin areas are protected. Do not attempt to access another user&apos;s
          data or bypass role restrictions.
        </p>
        <p>
          Questions about these terms can be sent through the{" "}
          <Link to="/contact" className="text-ivory underline decoration-gold/40 underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
