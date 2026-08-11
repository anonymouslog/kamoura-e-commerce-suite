import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import hero from "@/assets/hero.jpg";
import { ProductCard } from "@/components/site/ProductCard";
import { categories, featured } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kamoura — Quiet luxury clothing, made in limited runs" },
      {
        name: "description",
        content:
          "Coats, knitwear, shirting and tailoring in wool, silk and cashmere. Order by WhatsApp or email; shipped from Lagos.",
      },
      { property: "og:title", content: "Kamoura — Quiet luxury clothing" },
      {
        property: "og:description",
        content: "A small label working in wool, silk and cashmere. Limited runs.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [email, setEmail] = useState("");
  const collection = featured();

  return (
    <>
      {/* Signature moment: the full-bleed campaign frame. */}
      <section className="relative">
        <img
          src={hero}
          alt="Kamoura campaign — ivory wool coat in low light"
          width={1920}
          height={1088}
          className="h-[78vh] min-h-[420px] w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
            <div className="max-w-xl">
              <p className="eyebrow">Autumn — Winter</p>
              <h1 className="mt-5 font-display text-4xl leading-[1.05] text-ivory sm:text-6xl">
                Clothes that keep <em className="italic text-gold">quiet</em> company.
              </h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-silver">
                Twelve pieces, cut in wool, silk and cashmere. Made in small runs so nothing
                arrives twice.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="border border-gold bg-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory"
                >
                  Shop the collection
                </Link>
                <Link
                  to="/about"
                  className="border border-border px-7 py-3 text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-gold-soft"
                >
                  Our making
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 className="mt-3 font-display text-3xl text-ivory">The considered four</h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-[0.2em] text-grey transition-colors hover:text-gold"
          >
            View all
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {collection.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-bg-soft">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 sm:px-8 md:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.slug} to="/shop/$category" params={{ category: c.slug }} className="group">
              <p className="numeral text-xs text-gold-soft">
                {String(categories.indexOf(c) + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-2xl text-ivory group-hover:text-gold">
                {c.name}
              </h3>
              <p className="mt-2 text-sm text-grey">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <div className="rule-gold mx-auto w-24" />
        <h2 className="mt-8 font-display text-3xl text-ivory">
          Hear first when a run is <em className="italic text-gold">cut</em>
        </h2>
        <p className="mt-4 text-sm text-grey">
          One letter a season. No offers, no countdowns — just what has been made.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/.+@.+\..+/.test(email)) {
              toast.error("That email doesn't look right.");
              return;
            }
            setEmail("");
            toast.success("You're on the list. We'll write when the next run is cut.");
          }}
        >
          <label htmlFor="newsletter" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-input bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-grey-dim focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="border border-gold px-6 py-3 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
          >
            Join the list
          </button>
        </form>
      </section>
    </>
  );
}
