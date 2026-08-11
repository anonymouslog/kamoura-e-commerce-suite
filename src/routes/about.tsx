import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Kamoura — how the clothes are made" },
      {
        name: "description",
        content:
          "Kamoura works in small runs with mills in Italy, Scotland and Portugal. Read how the label is made and shipped.",
      },
      { property: "og:title", content: "About Kamoura" },
      { property: "og:description", content: "Small runs, honest cloth, no seasonal noise." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
      <p className="eyebrow">The house</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ivory sm:text-5xl">
        We make a few things, and we make them <em className="italic text-gold">slowly</em>.
      </h1>

      <div className="mt-16 grid gap-14 md:grid-cols-2">
        <img
          src={hero}
          alt="Kamoura atelier campaign image"
          width={1920}
          height={1088}
          loading="lazy"
          className="aspect-[4/5] w-full border border-border object-cover"
        />
        <div className="space-y-6 text-sm leading-relaxed text-grey">
          <p>
            Kamoura began with a single overcoat, remade eleven times until the shoulder fell
            correctly. That is still how the label works: one pattern, revised until it stops
            asking for attention.
          </p>
          <p>
            Cloth comes from mills we can name — tropical wool from Biella, cashmere spun in the
            Scottish borders, silk washed in Como. Garments are cut in Portugal and finished in
            Lagos, where the studio is.
          </p>
          <p>
            Runs are small, usually under sixty pieces. When a size sells through, it is gone
            until the cloth is available again. We would rather be quietly out of stock than
            loudly repetitive.
          </p>
          <div className="rule-gold w-24" />
          <p className="text-ivory">
            Every order is confirmed personally — by WhatsApp or email — before anything leaves the
            studio.
          </p>
          <Link
            to="/shop"
            className="inline-block border border-gold px-6 py-3 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
          >
            See what is available
          </Link>
        </div>
      </div>
    </div>
  );
}
