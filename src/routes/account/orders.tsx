import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackageOpen } from "lucide-react";
import { ordersQuery } from "@/lib/account-queries";

export const Route = createFileRoute("/account/orders")({ loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery), component: Orders });

function Orders() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  return <div className="space-y-5"><header className="border-b border-border pb-5"><p className="eyebrow">Purchases</p><h1 className="mt-1 text-2xl font-semibold text-ivory">Orders</h1><p className="mt-1 text-sm text-grey">Your order history and delivery progress.</p></header>
    {orders.length === 0 ? <Empty /> : <div className="space-y-4">{orders.map((order: any) => <article key={order.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.12em] text-grey">Order</p><p className="mt-1 font-medium text-ivory">{order.reference}</p><p className="mt-1 text-sm text-grey">{new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p></div><div className="sm:text-right"><OrderStatus status={order.status} /><p className="mt-2 font-medium text-ivory">₦{Number(order.total).toLocaleString("en-NG")}</p></div></div><ul className="divide-y divide-border">{order.order_items?.map((item: any) => <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span><span className="block text-ivory">{item.product_name ?? item.name}</span><span className="mt-1 block text-grey">Quantity {item.quantity}</span></span><span className="text-grey">₦{Number(item.price * item.quantity).toLocaleString("en-NG")}</span></li>)}</ul>{order.tracking_url ? <div className="border-t border-border px-5 py-3"><a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-ivory hover:text-gold">Track delivery</a></div> : null}</article>)}</div>}
  </div>;
}

function OrderStatus({ status }: { status: string }) { const color = status === "delivered" || status === "fulfilled" ? "bg-emerald-500" : status === "cancelled" ? "bg-red-500" : "bg-gold"; return <span className="inline-flex items-center gap-2 text-sm capitalize text-grey"><span className={`size-1.5 rounded-full ${color}`} />{status}</span>; }
function Empty() { return <div className="rounded-lg border border-dashed border-border bg-bg-soft px-5 py-12 text-center"><PackageOpen className="mx-auto size-6 text-grey" /><p className="mt-3 font-medium text-ivory">No orders yet</p><p className="mt-1 text-sm text-grey">Your purchases will appear here after checkout.</p></div>; }
