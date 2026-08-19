import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MapPin, Package, Settings } from "lucide-react";
import { accountQuery } from "@/lib/account-queries";

export const Route = createFileRoute("/account/")({ loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery), component: AccountIndex });

function AccountIndex() {
  const { data: account } = useSuspenseQuery(accountQuery);
  const name = account.profile?.full_name?.trim() || "Your account";
  const needsProfile = !account.profile?.full_name || !account.profile?.phone;
  return <div className="space-y-5">
    <header className="border-b border-border pb-5"><p className="eyebrow">Account</p><h1 className="mt-1 text-2xl font-semibold text-ivory">{name}</h1><p className="mt-1 text-sm text-grey">{account.email ?? "Email not available"}</p></header>
    {needsProfile ? <section className="rounded-lg border border-border bg-bg-soft p-5"><p className="font-medium text-ivory">Complete your profile</p><p className="mt-1 text-sm text-grey">Add your name and phone number to make deliveries and order updates easier.</p><Link to="/account/settings" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ivory hover:text-gold">Update details <ArrowRight className="size-4" /></Link></section> : null}
    <section className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3"><AccountAction to="/account/orders" title="Orders" text="Track purchases and delivery updates." icon={Package} /><AccountAction to="/account/addresses" title="Addresses" text="Manage delivery locations." icon={MapPin} /><AccountAction to="/account/settings" title="Settings" text="Profile and email preferences." icon={Settings} /></section>
  </div>;
}

function AccountAction({ to, title, text, icon: Icon }: { to: "/account/orders" | "/account/addresses" | "/account/settings"; title: string; text: string; icon: typeof Package }) { return <Link to={to} className="border-b border-border p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 hover:bg-bg-soft"><Icon className="size-4 text-grey" /><p className="mt-3 font-medium text-ivory">{title}</p><p className="mt-1 text-sm text-grey">{text}</p></Link>; }
