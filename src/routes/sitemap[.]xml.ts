import { createFileRoute } from "@tanstack/react-router";
import { categories } from "@/lib/catalog";
import { readLocalProducts } from "@/lib/cms-store";
import { publicServerClient } from "@/lib/supabase-public.server";

const staticRoutes = [
  "/",
  "/about",
  "/shop",
  "/bag",
  "/checkout",
  "/contact",
  "/auth",
  "/reset-password",
  "/privacy",
  "/terms",
  "/shipping-returns",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;

        let productSlugs: string[] = [];
        let categorySlugs = categories.map((category) => category.slug);

        try {
          const client = publicServerClient();
          const [{ data: products }, { data: categoryRows }] = await Promise.all([
            client.from("products").select("slug").eq("status", "active").order("slug"),
            client.from("categories").select("slug").order("sort_order"),
          ]);

          productSlugs = (products ?? []).map((product) => product.slug);
          if (categoryRows && categoryRows.length > 0) {
            categorySlugs = categoryRows.map((category) => category.slug);
          }
        } catch {
          productSlugs = readLocalProducts()
            .filter((product) => product.status === "active")
            .map((product) => product.slug);
        }

        const urls = [
          ...staticRoutes.map((path) => ({ loc: `${origin}${path}` })),
          ...categorySlugs.map((slug) => ({ loc: `${origin}/shop/${slug}` })),
          ...productSlugs.map((slug) => ({ loc: `${origin}/product/${slug}` })),
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
