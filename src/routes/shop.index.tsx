import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/site/Catalog";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop all — Kamoura coats, knitwear and tailoring" },
      {
        name: "description",
        content:
          "The full Kamoura catalogue: overcoats, cashmere knits, silk shirting and wool trousers. Filter by size, colour and price.",
      },
      { property: "og:title", content: "Shop all — Kamoura" },
      { property: "og:description", content: "The full catalogue, filterable by size and colour." },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">Everything available</h1>
      <p className="mt-4 max-w-lg text-sm text-grey">
        Twelve pieces in rotation. What is listed is in the studio; what is sold out will return
        only if the cloth does.
      </p>
      <Catalog />
    </div>
  );
}
