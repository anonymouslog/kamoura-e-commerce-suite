import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { storeConfig } from "@/lib/store-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Kamoura — sizing, orders and repairs" },
      {
        name: "description",
        content:
          "Reach the Kamoura studio about sizing, an existing order, alterations or repairs. We reply within one working day.",
      },
      { property: "og:title", content: "Contact Kamoura" },
      { property: "og:description", content: "Studio enquiries, sizing help and order questions." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">Write to the studio</h1>

      <div className="mt-14 grid gap-14 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-8 text-sm text-grey">
          <div>
            <p className="eyebrow">WhatsApp</p>
            <p className="numeral mt-2 text-ivory">+{storeConfig.whatsappNumber}</p>
            <p className="mt-1 text-xs text-grey-dim">Fastest for sizing and order questions.</p>
          </div>
          <div>
            <p className="eyebrow">Email</p>
            <p className="mt-2 text-ivory">{storeConfig.orderEmail}</p>
            <p className="mt-1 text-xs text-grey-dim">Replies within one working day.</p>
          </div>
          <div>
            <p className="eyebrow">Studio</p>
            <p className="mt-2 leading-relaxed text-ivory">
              14 Glover Road, Ikoyi
              <br />
              Lagos, Nigeria
            </p>
            <p className="mt-1 text-xs text-grey-dim">Fittings by appointment, Tue–Sat.</p>
          </div>
        </div>

        {sent ? (
          <div className="border border-border bg-bg-soft p-8">
            <h2 className="font-display text-2xl text-ivory">Message received</h2>
            <p className="mt-3 text-sm text-grey">
              Someone from the studio will write back within one working day. If it is urgent, send
              the same note on WhatsApp.
            </p>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Message sent to the studio.");
            }}
          >
            <Field label="Your name" name="name" />
            <Field label="Email" name="email" type="email" />
            <div>
              <label
                htmlFor="message"
                className="block text-[0.7rem] uppercase tracking-[0.18em] text-grey"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="mt-2 w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-grey-dim focus:border-gold focus:outline-none"
                placeholder="Sizing, an order, an alteration…"
              />
            </div>
            <button
              type="submit"
              className="border border-gold bg-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory"
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-[0.7rem] uppercase tracking-[0.18em] text-grey">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="mt-2 w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-grey-dim focus:border-gold focus:outline-none"
      />
    </div>
  );
}
