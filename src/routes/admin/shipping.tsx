import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminShippingConfigurationQuery } from "@/lib/admin-queries";
import { adminSaveShippingConfiguration } from "@/lib/shipping.functions";

export const Route = createFileRoute("/admin/shipping")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminShippingConfigurationQuery),
  component: AdminShipping,
});

function AdminShipping() {
  const queryClient = useQueryClient();
  const { data: configuration } = useSuspenseQuery(adminShippingConfigurationQuery);
  const [dispatchState, setDispatchState] = useState(configuration?.dispatch_state ?? "");
  const [sameStateFee, setSameStateFee] = useState(
    configuration ? String(configuration.same_state_fee) : "",
  );
  const [interstateFee, setInterstateFee] = useState(
    configuration ? String(configuration.interstate_fee) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDispatchState(configuration?.dispatch_state ?? "");
    setSameStateFee(configuration ? String(configuration.same_state_fee) : "");
    setInterstateFee(configuration ? String(configuration.interstate_fee) : "");
  }, [configuration]);

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5">
        <p className="eyebrow">Delivery setup</p>
        <h1 className="mt-1 text-2xl font-semibold text-ivory">Shipping</h1>
        <p className="mt-1 text-sm text-grey">
          Set the dispatch state and delivery fees used for checkout calculations.
        </p>
      </header>

      <section className="max-w-2xl rounded-lg border border-border bg-card p-5">
        {error ? <Notice kind="error">{error}</Notice> : null}
        {message ? <Notice kind="success">{message}</Notice> : null}
        <form
          className="mt-5 grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError(null);
            setMessage(null);
            try {
              await adminSaveShippingConfiguration({
                data: {
                  dispatch_state: dispatchState.trim(),
                  same_state_fee: Number(sameStateFee),
                  interstate_fee: Number(interstateFee),
                },
              });
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["admin", "shipping-configuration"] }),
                queryClient.invalidateQueries({ queryKey: ["shipping-configuration"] }),
              ]);
              setMessage("Shipping configuration saved.");
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Shipping configuration could not be saved.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field
            label="Dispatch state"
            value={dispatchState}
            onChange={setDispatchState}
            placeholder="Enter the store's actual dispatch state"
            required
          />
          <p className="text-sm font-medium text-ivory">Same-state delivery</p>
          <Field
            label="Applicable delivery fee (NGN)"
            value={sameStateFee}
            onChange={setSameStateFee}
            type="number"
            required
          />
          <p className="text-sm font-medium text-ivory">Interstate waybill</p>
          <Field
            label="Applicable waybill fee (NGN)"
            value={interstateFee}
            onChange={setInterstateFee}
            type="number"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save shipping settings"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-grey">{label}</span>
      <input
        required={required}
        value={value}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
      />
    </label>
  );
}

function Notice({ kind, children }: { kind: "error" | "success"; children: string }) {
  return (
    <p
      className={`rounded border px-3 py-2 text-sm ${kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}
    >
      {children}
    </p>
  );
}
