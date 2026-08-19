import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import type { ReactNode } from "react";

import hero from "@/assets/hero.jpg";
import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kamoura — Quiet luxury clothing" },
      {
        name: "description",
        content:
          "Kamoura is a small clothing label working in wool, silk and cashmere. Limited runs, shipped from Lagos.",
      },
      { name: "author", content: "Kamoura" },
      { property: "og:title", content: "Kamoura — Quiet luxury clothing" },
      {
        property: "og:description",
        content: "Coats, knitwear, shirting and tailoring made in limited runs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Kamoura" },
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f7f4ee" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Determine theme on the server from a cookie if available so SSR matches
  // the client. If no cookie is present, the server will fall back to no
  // explicit class (client will apply system preference) — to avoid
  // mismatches for returning users, we prefer cookie-driven rendering.
  let serverTheme: "light" | "dark" | null = null;
  try {
    if (typeof window === "undefined") {
      const req = getRequest();
      const cookie = req?.headers.get("cookie") ?? "";
      const match = cookie.match(/(?:^|; )kamoura-theme=(dark|light)(?:;|$)/);
      if (match) serverTheme = match[1] as "light" | "dark";
    }
  } catch (e) {
    // ignore — fallback to client-side handling
  }

  const htmlProps: any = { lang: "en" };
  if (serverTheme === "dark") {
    htmlProps.className = "dark";
    htmlProps.style = { colorScheme: "dark" };
  } else if (serverTheme === "light") {
    // explicit light theme can set color-scheme for consistency
    htmlProps.style = { colorScheme: "light" };
  }

  return (
    // Render html with server-side theme when available to prevent
    // hydration mismatches. The inline script below will still set the
    // theme early on the client if no cookie exists.
    // eslint-disable-next-line jsx-a11y/html-has-lang
    <html {...htmlProps}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  // Prefer cookie (set by ThemeToggle) so server and client
                  // agree. Fall back to localStorage then prefers-color-scheme.
                  function readCookie(name) {
                    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
                    return m ? decodeURIComponent(m[1]) : null;
                  }
                  var key = "kamoura-theme";
                  var theme = readCookie(key) || (localStorage && localStorage.getItem && localStorage.getItem(key));
                  if (!theme) {
                    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  }
                  document.documentElement.classList.toggle("dark", theme === "dark");
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdminRoute ? (
        <>
          <Outlet />
          <Toaster />
        </>
      ) : (
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <Toaster />
        </CartProvider>
      )}
    </QueryClientProvider>
  );
}
