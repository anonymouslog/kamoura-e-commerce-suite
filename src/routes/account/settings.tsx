import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { accountQuery } from "@/lib/account-queries";
import { updateMyProfile } from "@/lib/account.functions";

export const Route = createFileRoute("/account/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Settings,
});

function Settings() {
  const { data: account } = useSuspenseQuery(accountQuery);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(account.profile?.full_name ?? "");
    setPhone(account.profile?.phone ?? "");
    setMarketingOptIn(account.profile?.marketing_opt_in ?? false);
  }, [account]);

  return (
    <div className="rounded-3xl border border-border bg-bg-soft p-6 sm:p-8">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-3 font-display text-3xl text-ivory">Profile details</h1>
      <form
        className="mt-8 grid max-w-2xl gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await updateMyProfile({ data: { full_name: name, phone, marketing_opt_in: marketingOptIn } });
          setSaving(false);
          await queryClient.invalidateQueries({ queryKey: ["account"] });
        }}
      >
        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <label className="flex items-center gap-3 text-sm text-grey">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="size-4 accent-[#d9b36a]"
          />
          Receive occasional updates about new drops
        </label>
        <button
          disabled={saving}
          className="mt-2 inline-flex w-full justify-center border border-gold bg-gold px-4 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-grey">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-input bg-transparent px-4 py-3 text-sm text-ivory outline-none transition-colors focus:border-gold"
      />
    </label>
  );
}
