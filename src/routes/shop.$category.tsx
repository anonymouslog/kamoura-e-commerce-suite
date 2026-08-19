import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Catalog } from "@/components/site/Catalog";
import { getCategory, type CategorySlug } from "@/lib/catalog";
import { productsQuery } from "@/lib/catalog-queries";

export const Route = createFileRoute("/shop/$category")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Collection";
    return {
      meta: [
        { title: `${name} — Kamoura` },
        {
          name: "description",
          content: `${name} by Kamoura: ${loaderData?.category.blurb ?? ""} Made in small runs and shipped from Lagos.`,
        },
        { property: "og:title", content: `${name} — Kamoura` },
        { property: "og:description", content: loaderData?.category.blurb ?? "" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { data: products } = useSuspenseQuery(productsQuery);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
      <nav className="text-xs uppercase tracking-[0.18em] text-grey-dim">
        <Link to="/shop" className="hover:text-ivory">
          Shop
        </Link>
        <span className="px-2 text-gold-soft">/</span>
        <span className="text-grey">{category.name}</span>
      </nav>
      <h1 className="mt-5 font-display text-4xl text-ivory sm:text-5xl">{category.name}</h1>
      <p className="mt-4 max-w-lg text-sm text-grey">{category.blurb}</p>
      <Catalog products={products} category={category.slug as CategorySlug} />
    </div>
  );
}
