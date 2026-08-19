import { Outlet, Link, createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { Heart, MapPin, Package, Settings, UserRound } from "lucide-react";
import { accountQuery } from "@/lib/account-queries";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Kamoura" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ context, location }) => {
    try {
      const account = await context.queryClient.ensureQueryData(accountQuery);
      if (account?.roles?.includes("admin")) {
        throw redirect({
          to: "/admin",
          search: { redirect: location.href },
        });
      }
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside>
          <p className="eyebrow">My account</p>
          <nav className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            <AccountNav to="/account" label="Overview" icon={UserRound} />
            <AccountNav to="/account/orders" label="Orders" icon={Package} />
            <AccountNav to="/account/addresses" label="Addresses" icon={MapPin} />
            <AccountNav to="/account/wishlist" label="Wishlist" icon={Heart} />
            <AccountNav to="/account/settings" label="Settings" icon={Settings} />
          </nav>
        </aside>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

function AccountNav({ to, label, icon: Icon }: { to: "/account" | "/account/orders" | "/account/addresses" | "/account/wishlist" | "/account/settings"; label: string; icon: typeof UserRound }) {
  return <Link to={to} activeOptions={{ exact: true }} activeProps={{ className: "bg-bg-soft text-ivory" }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-grey transition-colors hover:bg-bg-soft hover:text-ivory"><Icon className="size-4" />{label}</Link>;
}
