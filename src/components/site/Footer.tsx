import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Instagram, Mail, MessageCircle, Music2 } from "lucide-react";
import { categories } from "@/lib/catalog";
import { Wordmark } from "./Wordmark";
import { storeConfig } from "@/lib/store-config";
import { siteCopyQuery } from "@/lib/site-copy-queries";

export function Footer() {
  const { data: copy } = useSuspenseQuery(siteCopyQuery);

  return (
    <footer className="mt-24 border-t border-border bg-bg-soft">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
        <div>
          <Wordmark width={160} />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-grey">{copy.aboutBlurb}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SocialPill
              href={`mailto:${copy.supportEmail}`}
              label={copy.supportEmail}
              icon={<Mail className="size-4" />}
            />
            <SocialPill
              href={`https://wa.me/${storeConfig.whatsappNumber}`}
              label={`+${storeConfig.whatsappNumber}`}
              icon={<MessageCircle className="size-4" />}
            />
            <SocialPill
              href={copy.instagramUrl || storeConfig.contact.instagram}
              label="Instagram"
              icon={<Instagram className="size-4" />}
              external
            />
            <SocialPill
              href={copy.tiktokUrl || storeConfig.contact.tiktok}
              label="TikTok"
              icon={<Music2 className="size-4" />}
              external
            />
          </div>
        </div>
        <div>
          <p className="eyebrow">Collection</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-grey sm:grid-cols-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/shop/$category"
                  params={{ category: c.slug }}
                  className="transition-colors hover:text-ivory"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">House</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-grey sm:grid-cols-1">
            <li>
              <Link to="/about" className="transition-colors hover:text-ivory">
                About Kamoura
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-ivory">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/bag" className="transition-colors hover:text-ivory">
                Your bag
              </Link>
            </li>
            <li>
              <Link to="/shipping-returns" className="transition-colors hover:text-ivory">
                Shipping and returns
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-ivory">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition-colors hover:text-ivory">
                Terms of service
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-grey-dim sm:flex-row sm:justify-between sm:px-8">
          <p>&copy; {new Date().getFullYear()} Kamoura. All rights reserved.</p>
          <p>Orders are confirmed by WhatsApp or email before dispatch.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialPill({
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
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-grey transition-colors hover:border-gold/50 hover:text-ivory"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={label}
    >
      <span className="text-gold">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
