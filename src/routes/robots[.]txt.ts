import { createFileRoute } from "@tanstack/react-router";

const disallowPaths = ["/admin/", "/account/", "/auth", "/checkout/", "/reset-password"];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const lines = [
          "User-agent: *",
          "Allow: /",
          "",
          ...disallowPaths.map((path) => `Disallow: ${path}`),
          "",
          `Sitemap: ${origin}/sitemap.xml`,
        ];

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
