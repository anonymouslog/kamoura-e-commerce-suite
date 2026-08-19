import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Mail, PhoneCall, RefreshCw, Truck } from "lucide-react";
import { useState } from "react";
import { adminOrdersQuery } from "@/lib/admin-queries";
import { adminUpdateOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/orders")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOrdersQuery),
  component: Orders,
});

function Orders() {
  const { data: orders } = useSuspenseQuery(adminOrdersQuery);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const awaiting = orders.filter((order) => order.status === "placed" || order.status === "confirmed");
  const shipped = orders.filter((order) => order.status === "shipped" || order.status === "delivered");
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Orders</p>
            <h1 className="mt-3 text-3xl font-semibold text-ivory">Fulfilment desk</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-grey">
              Review every order in a clean operations layout. Customer details, item summary, and
              timeline live side by side so dispatch is faster.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Total orders" value={`${orders.length}`} />
            <Metric label="Awaiting" value={`${awaiting.length}`} />
            <Metric label="Revenue" value={`₦${totalRevenue.toLocaleString("en-NG")}`} wide />
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {orders.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-bg-soft p-6 text-sm text-grey">
            No orders yet.
          </div>
        )}

        {orders.map((order: any) => {
          const primaryEvent = order.order_events?.[0] ?? null;

          return (
            <article key={order.id} className="rounded-3xl border border-border bg-card">
              <div className="border-b border-border px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-ivory">{order.reference}</h2>
                      <StatusPill>{order.status}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-grey">
                      {order.contact_name} · {order.contact_phone}
                    </p>
                    <p className="mt-1 text-xs text-grey-dim">
                      {order.contact_email} · {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      defaultValue={order.status}
                      disabled={loadingId === order.id}
                      onChange={async (e) => {
                        setLoadingId(order.id);
                        await adminUpdateOrderStatus({
                          data: { id: order.id, status: e.target.value as any },
                        });
                        setLoadingId(null);
                        location.reload();
                      }}
                      className="rounded-full border border-input bg-background px-4 py-2 text-sm text-ivory outline-none"
                    >
                      <option value="placed">placed</option>
                      <option value="confirmed">confirmed</option>
                      <option value="paid">paid</option>
                      <option value="fulfilled">fulfilled</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-grey transition-colors hover:border-gold hover:text-ivory"
                      >
                        <Truck className="size-4" />
                        Tracking
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-grey transition-colors hover:border-gold hover:text-ivory"
                      onClick={() => {
                        if (order.contact_email) window.location.href = `mailto:${order.contact_email}`;
                      }}
                    >
                      <Mail className="size-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-grey transition-colors hover:border-gold hover:text-ivory"
                      onClick={() => {
                        if (order.contact_phone) {
                          const digits = String(order.contact_phone).replace(/\D/g, "");
                          window.location.href = `tel:${digits}`;
                        }
                      }}
                    >
                      <PhoneCall className="size-4" />
                      Call
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="border-b border-border p-6 sm:p-8 xl:border-b-0 xl:border-r">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="eyebrow">Items</p>
                      <h3 className="mt-2 text-xl font-semibold text-ivory">Order summary</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-grey-dim">Total</p>
                      <p className="mt-1 text-2xl font-semibold text-ivory">
                        ₦{Number(order.total).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border bg-bg-soft p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-ivory">
                              {item.product_name ?? item.name}
                            </p>
                            <p className="mt-1 text-sm text-grey">
                              {item.variant_label}
                              {item.product_slug ? ` · ${item.product_slug}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-grey">
                              x{item.quantity} · ₦
                              {Number(item.unit_price_at_purchase ?? item.price ?? 0).toLocaleString("en-NG")}
                            </p>
                            <p className="mt-1 text-sm font-medium text-ivory">
                              ₦
                              {Number(
                                Number(item.unit_price_at_purchase ?? item.price ?? 0) *
                                  Number(item.quantity ?? 1),
                              ).toLocaleString("en-NG")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <SummaryPill label="Subtotal" value={`₦${Number(order.subtotal).toLocaleString("en-NG")}`} />
                    <SummaryPill
                      label="Shipping"
                      value={`₦${Number(order.shipping_cost).toLocaleString("en-NG")}`}
                    />
                    <SummaryPill label="Status" value={order.status} />
                  </div>

                  {order.customer_note ? (
                    <div className="mt-6 rounded-2xl border border-border bg-bg-soft p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-grey-dim">
                        <AlertCircle className="size-4 text-gold" />
                        Customer note
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-grey">{order.customer_note}</p>
                    </div>
                  ) : null}
                </section>

                <aside className="space-y-0">
                  <section className="border-b border-border p-6 sm:p-8">
                    <p className="eyebrow">Customer</p>
                    <h3 className="mt-2 text-xl font-semibold text-ivory">Contact and delivery</h3>
                    <div className="mt-5 space-y-4 text-sm">
                      <InfoRow label="Name" value={order.contact_name} />
                      <InfoRow label="Email" value={order.contact_email} />
                      <InfoRow label="Phone" value={order.contact_phone} />
                      <InfoRow label="Address" value={formatAddress(order.shipping_address)} />
                      <InfoRow label="Payment" value={order.payment_method ?? "Manual review"} />
                    </div>
                  </section>

                  <section className="p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="eyebrow">Timeline</p>
                        <h3 className="mt-2 text-xl font-semibold text-ivory">Order events</h3>
                      </div>
                      <RefreshCw className="size-4 text-gold" />
                    </div>

                    <div className="mt-5 space-y-3">
                      {(order.order_events?.length ? order.order_events : [{ status: order.status, note: "Order created", created_at: order.created_at }]).map(
                        (event: any) => (
                          <div key={`${event.status}-${event.created_at}`} className="flex gap-3 rounded-2xl border border-border bg-bg-soft p-4">
                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-ivory">{event.status}</p>
                                <span className="text-xs text-grey-dim">
                                  {event.created_at ? new Date(event.created_at).toLocaleString() : "Just now"}
                                </span>
                              </div>
                              {event.note ? <p className="mt-1 text-sm text-grey">{event.note}</p> : null}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FooterStat label="Awaiting action" value={`${awaiting.length}`} />
        <FooterStat label="Shipped / delivered" value={`${shipped.length}`} />
        <FooterStat label="Total revenue" value={`₦${totalRevenue.toLocaleString("en-NG")}`} />
        <FooterStat label="Open tracking links" value={`${orders.filter((o) => o.tracking_url).length}`} />
      </div>
    </div>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-bg-soft px-4 py-3 ${wide ? "sm:min-w-[14rem]" : ""}`}>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-grey-dim">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ivory">{value}</p>
    </div>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-grey">
      {children}
    </span>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-grey-dim">{label}</p>
      <p className="mt-1 text-sm font-medium text-ivory">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-grey-dim">{label}</span>
      <span className="max-w-[18rem] text-right text-ivory">{value}</span>
    </div>
  );
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-grey-dim">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ivory">{value}</p>
    </div>
  );
}

function formatAddress(address: any): string {
  if (!address) return "No address saved";
  const parts = [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
    .filter(Boolean)
    .map(String);
  return parts.length ? parts.join(", ") : "No address saved";
}
