import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateSiteCopy } from "@/lib/site-copy.functions";
import { siteCopyQuery } from "@/lib/site-copy-queries";

type ContentForm = {
  heroTitle: string;
  heroSubtitle: string;
  featuredTitle: string;
  newsletterTitle: string;
  newsletterText: string;
  aboutBlurb: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl: string;
  tiktokUrl: string;
};

export const Route = createFileRoute("/admin/content")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteCopyQuery),
  component: AdminContent,
});

function AdminContent() {
  const { data: copy } = useSuspenseQuery(siteCopyQuery);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContentForm>(copy as ContentForm);

  useEffect(() => {
    setForm(copy as ContentForm);
  }, [copy]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow">Content Studio</p>
        <h1 className="mt-2 text-2xl font-semibold text-ivory">Homepage and contact copy</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-grey">
          Manage the public-facing brand text, newsletter copy, and contact details from one place.
        </p>

        <form
          className="mt-6 grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await updateSiteCopy({
                data: {
                  heroTitle: form.heroTitle,
                  heroSubtitle: form.heroSubtitle,
                  featuredTitle: form.featuredTitle,
                  newsletterTitle: form.newsletterTitle,
                  newsletterText: form.newsletterText,
                  aboutBlurb: form.aboutBlurb,
                  supportEmail: form.supportEmail,
                  supportPhone: form.supportPhone,
                  instagramUrl: form.instagramUrl,
                  tiktokUrl: form.tiktokUrl,
                },
              });
              await queryClient.invalidateQueries({ queryKey: ["site-copy"] });
              toast.success("Content updated.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save content.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Hero title" value={form.heroTitle} onChange={(value) => setForm((prev) => ({ ...prev, heroTitle: value }))} />
          <Field
            label="Hero subtitle"
            value={form.heroSubtitle}
            onChange={(value) => setForm((prev) => ({ ...prev, heroSubtitle: value }))}
          />
          <Field
            label="Featured section title"
            value={form.featuredTitle}
            onChange={(value) => setForm((prev) => ({ ...prev, featuredTitle: value }))}
          />
          <Field
            label="Newsletter title"
            value={form.newsletterTitle}
            onChange={(value) => setForm((prev) => ({ ...prev, newsletterTitle: value }))}
          />
          <TextareaField
            label="Newsletter text"
            value={form.newsletterText}
            onChange={(value) => setForm((prev) => ({ ...prev, newsletterText: value }))}
          />
          <TextareaField
            label="About blurb"
            value={form.aboutBlurb}
            onChange={(value) => setForm((prev) => ({ ...prev, aboutBlurb: value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Support email"
              value={form.supportEmail}
              onChange={(value) => setForm((prev) => ({ ...prev, supportEmail: value }))}
            />
            <Field
              label="Support phone"
              value={form.supportPhone}
              onChange={(value) => setForm((prev) => ({ ...prev, supportPhone: value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Instagram URL"
              value={form.instagramUrl}
              onChange={(value) => setForm((prev) => ({ ...prev, instagramUrl: value }))}
            />
            <Field
              label="TikTok URL"
              value={form.tiktokUrl}
              onChange={(value) => setForm((prev) => ({ ...prev, tiktokUrl: value }))}
            />
          </div>
          <button
            disabled={saving}
            className="inline-flex w-fit border border-gold bg-gold px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-gold-soft hover:text-ivory disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save content"}
          </button>
        </form>
      </section>

      <aside className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="eyebrow">Live preview</p>
          <h2 className="mt-2 text-xl font-semibold text-ivory">{form.heroTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-grey">{form.heroSubtitle}</p>
          <div className="mt-5 rounded-md border border-border bg-bg-soft p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-grey-dim">Newsletter</p>
            <p className="mt-2 font-semibold text-ivory">{form.newsletterTitle}</p>
            <p className="mt-2 text-sm text-grey">{form.newsletterText}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="eyebrow">Contact details</p>
          <div className="mt-4 space-y-3 text-sm text-grey">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-grey-dim">Email</p>
              <p className="mt-1 text-ivory">{form.supportEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-grey-dim">Phone</p>
              <p className="mt-1 text-ivory">{form.supportPhone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-grey-dim">Instagram</p>
              <p className="mt-1 break-all text-ivory">{form.instagramUrl || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-grey-dim">TikTok</p>
              <p className="mt-1 break-all text-ivory">{form.tiktokUrl || "Not set"}</p>
            </div>
          </div>
        </div>
      </aside>
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
      <span className="text-xs uppercase tracking-[0.18em] text-grey-dim">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-transparent px-4 py-3 text-sm text-ivory outline-none placeholder:text-grey-dim focus:border-gold"
      />
    </label>
  );
}

function TextareaField({
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
      <span className="text-xs uppercase tracking-[0.18em] text-grey-dim">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-transparent px-4 py-3 text-sm text-ivory outline-none placeholder:text-grey-dim focus:border-gold"
      />
    </label>
  );
}
