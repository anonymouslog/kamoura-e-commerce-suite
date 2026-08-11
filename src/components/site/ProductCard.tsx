import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/store-config";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
      aria-label={product.name}
    >
      <div className="relative overflow-hidden border border-border bg-bg-soft">
        <img
          src={product.image}
          alt={`${product.name} — ${product.colors.join(", ")}`}
          width={900}
          height={1200}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 border border-border bg-background/80 px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-grey">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-lg text-ivory">{product.name}</h3>
        <span className="numeral text-sm text-silver">{formatPrice(product.price)}</span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-grey-dim">
        {product.colors.join(" / ")}
      </p>
    </Link>
  );
}
