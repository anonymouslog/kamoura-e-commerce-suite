import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";
import { dedupeGalleryImages, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/store-config";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productQuery, productsQuery } from "@/lib/catalog-queries";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ loaderData }) => {
    const p = loaderData as Product | null;
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
  const product = Route.useLoaderData() as Product;
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState(product.colors[0] ?? "");
  const soldOut = product.stock === 0;
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: collections } = useSuspenseQuery(categoriesQuery);
  const suggestions = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 6);
  const galleryImages = dedupeGalleryImages([product.image, product.image]);
  const hasSizeOptions = product.sizes.length > 0;
  const hasColorOptions = product.colors.length > 0;

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
          {collections.find((collection) => collection.slug === product.category)?.name ??
            product.category}
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {galleryImages.map((image, index) => (
            <img
              key={`${product.slug}-${image}-${index}`}
              src={image}
              alt={`${product.name}${index === 0 ? ` in ${color || "the studio"}` : " detail"}`}
              width={900}
              height={1200}
              loading={index === 0 ? "eager" : "lazy"}
              className="image-portrait w-full border border-border object-cover object-bottom"
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <h1 className="font-display text-3xl text-ivory sm:text-4xl">{product.name}</h1>
          <p className="numeral mt-3 text-lg text-gold">{formatPrice(product.price)}</p>
          <p className="mt-6 text-sm leading-relaxed text-grey">{product.description}</p>

          {hasColorOptions ? (
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
          ) : null}

          {hasSizeOptions ? (
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
          ) : null}

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
              if (hasSizeOptions && !size) {
                toast.error("Choose a size first.");
                return;
              }
              if (hasColorOptions && !color) {
                toast.error("Choose a colour first.");
                return;
              }
              add({
                slug: product.slug,
                name: product.name,
                size: size ?? "One size",
                color: color || "Default",
                price: product.price,
                image: product.image,
              });
              toast.success(
                `${product.name} — ${size ?? "One size"}${hasColorOptions ? ` / ${color}` : ""} added to your bag.`,
              );
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
