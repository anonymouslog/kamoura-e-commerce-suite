import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle, Music2, Phone } from "lucide-react";
import { toast } from "sonner";
import { storeConfig } from "@/lib/store-config";
import { siteCopyQuery } from "@/lib/site-copy-queries";

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
  const { data: copy } = useSuspenseQuery(siteCopyQuery);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ivory sm:text-5xl">
        Write to the studio
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ContactCard
            eyebrow="Phone"
            icon={<Phone className="size-4" />}
            href={`tel:${storeConfig.contact.phoneE164}`}
            value={copy.supportPhone}
            note="Main contact line for the studio."
          />
          <ContactCard
            eyebrow="WhatsApp"
            icon={<MessageCircle className="size-4" />}
            href={`https://wa.me/${storeConfig.whatsappNumber}`}
            value="Chat on WhatsApp"
            note="Fastest for sizing and order questions."
            external
          />
          <ContactCard
            eyebrow="Email"
            icon={<Mail className="size-4" />}
            href={`mailto:${copy.supportEmail}`}
            value={copy.supportEmail}
            note="Replies within one working day."
          />
          <ContactCard
            eyebrow="Studio"
            icon={<MapPin className="size-4" />}
            value={copy.aboutBlurb}
            note="Fittings by appointment, Tue–Sat."
          />
          <div className="rounded-2xl border border-border bg-bg-soft p-5 sm:col-span-2 lg:col-span-1">
            <p className="eyebrow">Social</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <SocialChip
                href={copy.instagramUrl || storeConfig.contact.instagram}
                label="Instagram"
                icon={<Instagram className="size-4" />}
                external
              />
              <SocialChip
                href={copy.tiktokUrl || storeConfig.contact.tiktok}
                label="TikTok"
                icon={<Music2 className="size-4" />}
                external
              />
            </div>
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-bg-soft p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ivory">Message received</h2>
            <p className="mt-3 text-sm text-grey">
              Someone from the studio will write back within one working day. If it is urgent, send
              the same note on WhatsApp.
            </p>
          </div>
        ) : (
          <form
            className="space-y-5 rounded-2xl border border-border bg-bg-soft p-6 sm:p-8"
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
              className="w-full border border-gold bg-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory sm:w-auto"
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ContactCard({
  eyebrow,
  icon,
  value,
  href,
  note,
  external = false,
}: {
  eyebrow: string;
  icon: ReactNode;
  value: ReactNode;
  href?: string;
  note: string;
  external?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft p-5">
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-gold">
          {icon}
        </span>
        <div className="min-w-0">
          {href ? (
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="block break-words text-ivory transition-colors hover:text-gold"
            >
              {value}
            </a>
          ) : (
            <p className="break-words text-ivory">{value}</p>
          )}
          <p className="mt-1 text-xs text-grey-dim">{note}</p>
        </div>
      </div>
    </div>
  );
}

function SocialChip({
  href,
  label,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-grey transition-colors hover:border-gold/50 hover:text-ivory"
    >
      <span className="text-gold">{icon}</span>
      <span>{label}</span>
    </a>
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
