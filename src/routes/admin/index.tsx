import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Package, ShoppingBag, Users } from "lucide-react";
import { adminNewsletterQuery, adminOrdersQuery, adminProductsQuery } from "@/lib/admin-queries";
import { siteCopyQuery } from "@/lib/site-copy-queries";

export const Route = createFileRoute("/admin/")({ component: AdminIndex });

function AdminIndex() {
  const { data: products } = useSuspenseQuery(adminProductsQuery);
  const { data: orders } = useSuspenseQuery(adminOrdersQuery);
  const { data: newsletter } = useSuspenseQuery(adminNewsletterQuery);
  const { data: copy } = useSuspenseQuery(siteCopyQuery);
  const activeProducts = products.filter((product) => product.status === "active").length;
  const drafts = products.filter((product) => product.status === "draft").length;
  const attention = orders.filter((order) => order.status === "placed" || order.status === "confirmed");

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Overview</p><h1 className="mt-1 text-2xl font-semibold text-ivory">Dashboard</h1><p className="mt-1 text-sm text-grey">A concise view of the work that needs attention.</p></div>
      <div className="flex flex-wrap gap-2"><Action to="/admin/products" icon={Package}>Create product</Action><Action to="/admin/orders" icon={ShoppingBag}>View orders</Action></div>
    </header>

    <section className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Orders" value={orders.length} note={`${attention.length} need review`} icon={ShoppingBag} />
      <Metric label="Products" value={products.length} note={`${activeProducts} published`} icon={Package} />
      <Metric label="Drafts" value={drafts} note="not visible in store" icon={FileText} />
      <Metric label="Subscribers" value={newsletter.length} note="newsletter list" icon={Users} />
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-ivory">Recent orders</h2><p className="mt-1 text-sm text-grey">Newest customer activity</p></div><Link to="/admin/orders" className="text-sm text-grey hover:text-ivory">See all</Link></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-border bg-bg-soft text-xs uppercase tracking-[0.12em] text-grey"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Total</th></tr></thead><tbody className="divide-y divide-border">{orders.slice(0, 7).map((order) => <tr key={order.id} className="hover:bg-bg-soft"><td className="px-5 py-4 font-medium text-ivory">{order.reference}</td><td className="px-4 py-4"><p className="text-ivory">{order.contact_name}</p><p className="mt-1 text-xs text-grey">{order.contact_email}</p></td><td className="px-4 py-4 text-grey">{new Date(order.created_at).toLocaleDateString()}</td><td className="px-4 py-4"><Status status={order.status} /></td><td className="px-5 py-4 text-right font-medium text-ivory">₦{Number(order.total).toLocaleString("en-NG")}</td></tr>)}{orders.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-grey">Orders will appear here when customers checkout.</td></tr> : null}</tbody></table></div>
      </section>
      <aside className="space-y-5">
        <Panel title="Work queue"><QueueRow value={attention.length} label="Orders awaiting review" /><QueueRow value={drafts} label="Products still in draft" /><Link to="/admin/orders" className="mt-4 inline-flex items-center gap-1.5 text-sm text-grey hover:text-ivory">Open order desk <ArrowRight className="size-4" /></Link></Panel>
        <Panel title="Store settings"><p className="text-sm text-grey">{copy.supportEmail}</p><p className="mt-1 text-sm text-grey">{copy.supportPhone}</p><Link to="/admin/content" className="mt-4 inline-flex items-center gap-1.5 text-sm text-grey hover:text-ivory">Manage content <ArrowRight className="size-4" /></Link></Panel>
      </aside>
    </div>
  </div>;
}

function Action({ to, icon: Icon, children }: { to: "/admin/products" | "/admin/orders"; icon: typeof Package; children: string }) { return <Link to={to} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-ivory hover:bg-bg-soft"><Icon className="size-4" />{children}</Link>; }
function Metric({ label, value, note, icon: Icon }: { label: string; value: number; note: string; icon: typeof Package }) { return <div className="border-b border-border p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:[&:not(:last-child)]:border-r"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.12em] text-grey">{label}</p><Icon className="size-4 text-grey-dim" /></div><p className="mt-3 text-2xl font-semibold text-ivory">{value}</p><p className="mt-1 text-sm text-grey">{note}</p></div>; }
function Status({ status }: { status: string }) { const color = status === "cancelled" ? "bg-red-500" : status === "delivered" || status === "fulfilled" ? "bg-emerald-500" : "bg-gold"; return <span className="inline-flex items-center gap-2 text-xs capitalize text-grey"><span className={`size-1.5 rounded-full ${color}`} />{status}</span>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-lg border border-border bg-card p-5"><h2 className="font-semibold text-ivory">{title}</h2><div className="mt-4">{children}</div></section>; }
function QueueRow({ value, label }: { value: number; label: string }) { return <div className="flex items-center justify-between border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"><span className="text-sm text-grey">{label}</span><span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-ivory">{value}</span></div>; }
