import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";
import { getProduct, related, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/store-config";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return {};
    return {
      meta: [
        { title: `${p.name} — Kamoura` },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: `${p.name} — Kamoura` },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:type", content: "product" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            brand: { "@type": "Brand", name: "Kamoura" },
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "NGN",
              availability:
                p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0]!);
  const soldOut = product.stock === 0;
  const suggestions = related(product.slug, product.category);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
      <nav className="text-xs uppercase tracking-[0.18em] text-grey-dim">
        <Link to="/shop" className="hover:text-ivory">
          Shop
        </Link>
        <span className="px-2 text-gold-soft">/</span>
        <Link
          to="/shop/$category"
          params={{ category: product.category }}
          className="hover:text-ivory"
        >
          {product.category}
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <img
            src={product.image}
            alt={`${product.name} in ${color}`}
            width={900}
            height={1200}
            className="aspect-[3/4] w-full border border-border object-cover"
          />
          <img
            src={product.image}
            alt={`${product.name} detail`}
            width={900}
            height={1200}
            loading="lazy"
            className="aspect-[3/4] w-full border border-border object-cover object-bottom"
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <h1 className="font-display text-3xl text-ivory sm:text-4xl">{product.name}</h1>
          <p className="numeral mt-3 text-lg text-gold">{formatPrice(product.price)}</p>
          <p className="mt-6 text-sm leading-relaxed text-grey">{product.description}</p>

          <div className="mt-8">
            <p className="eyebrow">Colour</p>
            <div className="mt-3 flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={`border px-4 py-2 text-xs tracking-[0.1em] transition-colors ${
                    color === c
                      ? "border-gold text-gold"
                      : "border-border text-grey hover:border-gold-soft hover:text-ivory"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="eyebrow">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  disabled={soldOut}
                  onClick={() => setSize(s)}
                  className={`min-w-12 border px-3 py-2 text-xs tracking-[0.1em] transition-colors disabled:opacity-40 ${
                    size === s
                      ? "border-gold bg-gold text-primary-foreground"
                      : "border-border text-grey hover:border-gold-soft hover:text-ivory"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-grey-dim">
            {soldOut
              ? "Sold out — the cloth is on order"
              : product.stock <= 5
                ? `Only ${product.stock} left in this run`
                : "In the studio, ready to ship"}
          </p>

          <button
            type="button"
            disabled={soldOut}
            onClick={() => {
              if (!size) {
                toast.error("Choose a size first.");
                return;
              }
              add({
                slug: product.slug,
                name: product.name,
                size,
                color,
                price: product.price,
                image: product.image,
              });
              toast.success(`${product.name} — ${size} added to your bag.`);
            }}
            className="mt-8 w-full border border-gold bg-gold px-7 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-grey-dim"
          >
            {soldOut ? "Sold out" : "Add to bag"}
          </button>

          <ul className="mt-8 space-y-2 border-t border-border pt-6 text-sm text-grey">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
            <li>Shipped from Lagos in 1–5 working days.</li>
          </ul>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl text-ivory">Shown with</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
