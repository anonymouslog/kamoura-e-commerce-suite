import {
  Link,
  Outlet,
  createFileRoute,
  isRedirect,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Search,
  Shield,
  LogOut,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { accountQuery } from "@/lib/account-queries";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Kamoura" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/admin/login") return;
    try {
      const account = await context.queryClient.fetchQuery({ ...accountQuery, staleTime: 0 });
      if (!account?.roles?.includes("admin")) {
        throw redirect({ to: "/account", search: { redirect: location.href } });
      }
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AdminRouteBoundary,
});

function AdminRouteBoundary() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/admin/login" ? <Outlet /> : <AdminLayout />;
}

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-20 items-center justify-between border-b border-border px-5">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-grey-dim">Kamoura</p>
              <p className="mt-1 text-lg font-semibold text-ivory">Admin</p>
            </div>
            <Shield className="size-4 text-gold" />
          </div>

          <nav className="space-y-6 px-4 py-6">
            <NavGroup
              title="Overview"
              items={[
                { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
                { to: "/admin/content", label: "Content Studio", icon: Sparkles },
              ]}
            />
            <NavGroup
              title="Commerce"
              items={[
                { to: "/admin/products", label: "Products", icon: Package },
                { to: "/admin/collections", label: "Collections", icon: Tags },
                { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
                { to: "/admin/users", label: "Users", icon: Users },
                { to: "/admin/shipping", label: "Shipping", icon: Truck },
              ]}
            />
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex items-center gap-2 px-5 py-3 sm:gap-3 sm:px-8">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-card px-3 sm:max-w-2xl">
                <Search className="size-4 text-grey-dim" />
                <input
                  value=""
                  readOnly
                  placeholder="Search products, orders, customers..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-ivory placeholder:text-grey-dim focus:outline-none"
                />
                <kbd className="hidden shrink-0 whitespace-nowrap rounded border border-border bg-bg-soft px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-grey-dim md:inline">
                  Ctrl + K
                </kbd>
              </div>
              <ThemeToggle />
              <Link
                to="/"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs uppercase tracking-[0.14em] text-grey transition-colors hover:border-gold hover:text-ivory"
              >
                <Store className="size-4" />
                Storefront
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => {
                  void (async () => {
                    setSigningOut(true);
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) throw error;
                      queryClient.clear();
                      await navigate({ to: "/auth", replace: true });
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Sign out could not be completed.",
                      );
                    } finally {
                      setSigningOut(false);
                    }
                  })();
                }}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs uppercase tracking-[0.14em] text-grey transition-colors hover:border-gold hover:text-ivory disabled:opacity-50"
              >
                <LogOut className="size-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </header>

          <main className="px-5 py-8 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ to: string; label: string; icon: ComponentType<{ className?: string }> }>;
}) {
  return (
    <div>
      <p className="px-2 text-[0.68rem] uppercase tracking-[0.2em] text-grey-dim">{title}</p>
      <div className="mt-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeProps={{ className: "border-gold/40 bg-bg-soft text-ivory" }}
            className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-grey transition-colors hover:border-border hover:bg-bg-soft hover:text-ivory"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
