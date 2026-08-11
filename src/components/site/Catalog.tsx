import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { allColors, allSizes, products, type CategorySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/store-config";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

const sorts: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "name", label: "Alphabetical" },
];

const maxPrice = Math.max(...products.map((p) => p.price));

export function Catalog({ category }: { category?: CategorySlug }) {
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [ceiling, setCeiling] = useState(maxPrice);
  const [sort, setSort] = useState<Sort>("featured");

  const results = useMemo(() => {
    const list = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!size || p.sizes.includes(size)) &&
        (!color || p.colors.includes(color)) &&
        p.price <= ceiling,
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return sorted;
  }, [category, size, color, ceiling, sort]);

  const filtered = size || color || ceiling < maxPrice;

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-8">
        <FilterGroup
          label="Size"
          options={category ? allSizes.filter((s) => results.some((p) => p.sizes.includes(s)) || s === size) : allSizes}
          value={size}
          onChange={setSize}
        />
        <FilterGroup label="Colour" options={allColors} value={color} onChange={setColor} />
        <div>
          <p className="eyebrow">Up to</p>
          <input
            type="range"
            min={90000}
            max={maxPrice}
            step={5000}
            value={ceiling}
            onChange={(e) => setCeiling(Number(e.target.value))}
            aria-label="Maximum price"
            className="mt-4 w-full accent-[var(--color-gold)]"
          />
          <p className="numeral mt-2 text-sm text-silver">{formatPrice(ceiling)}</p>
        </div>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setSize(null);
              setColor(null);
              setCeiling(maxPrice);
            }}
            className="text-xs uppercase tracking-[0.18em] text-gold hover:text-ivory"
          >
            Clear filters
          </button>
        )}
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-grey">
            <span className="numeral text-silver">{results.length}</span>{" "}
            {results.length === 1 ? "piece" : "pieces"}
          </p>
          <label className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-grey">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-input bg-background px-3 py-2 text-xs text-ivory focus:border-gold focus:outline-none"
            >
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <div className="mt-16 max-w-md">
            <h2 className="font-display text-2xl text-ivory">Nothing matches that combination</h2>
            <p className="mt-3 text-sm text-grey">
              The runs are small, so filters narrow quickly. Loosen the size or price and the rest
              of the collection reappears.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
            {results.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : o)}
              className={`border px-3 py-1.5 text-xs tracking-[0.08em] transition-colors ${
                active
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border text-grey hover:border-gold-soft hover:text-ivory"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
