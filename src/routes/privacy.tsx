import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Kamoura" },
      {
        name: "description",
        content: "How Kamoura handles account data, orders, analytics, and contact information.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-20 sm:px-8">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">Privacy Policy</h1>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-grey">
        <p>
          Kamoura collects the minimum data needed to process orders, manage accounts, and reply
          to studio enquiries. That includes contact details, order history, shipping addresses,
          and authentication data.
        </p>
        <p>
          Order confirmations may be delivered through WhatsApp or email. If you use either
          channel, the details you submit for the order will be shared with the destination you
          choose.
        </p>
        <p>
          We use Supabase for authentication and storage. Data in your account is protected by row
          level security and server-side role checks. Service-role credentials are never exposed to
          the browser.
        </p>
        <p>
          We do not sell customer data. We only use it to operate the store, fulfil orders, and
          improve the experience.
        </p>
        <p>
          To request access, correction, or deletion of your data, contact the studio through the
          <Link to="/contact" className="text-ivory underline decoration-gold/40 underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
