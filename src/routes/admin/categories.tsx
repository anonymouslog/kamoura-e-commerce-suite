import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { adminDeleteCategory, adminUpsertCategory } from "@/lib/admin.functions";
import { adminCategoriesQuery } from "@/lib/admin-queries";
import { categories } from "@/lib/catalog";

type CategoryFormState = {
  slug: string;
  name: string;
  blurb: string;
  sort_order: string;
};

const emptyForm = (): CategoryFormState => ({
  slug: "",
  name: "",
  blurb: "",
  sort_order: "0",
});

export const Route = createFileRoute("/admin/categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminCategoriesQuery),
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categoriesData } = useSuspenseQuery(adminCategoriesQuery);
  const [editingSlug, setEditingSlug] = useState("");
  const [form, setForm] = useState<CategoryFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingCategory = useMemo(
    () => categoriesData.find((category) => category.slug === editingSlug) ?? null,
    [categoriesData, editingSlug],
  );

  const resetForm = () => {
    setEditingSlug("");
    setForm(emptyForm());
    setMessage(null);
    setError(null);
  };

  const startEditing = (slug: string) => {
    const category = categoriesData.find((item) => item.slug === slug);
    if (!category) return;
    setEditingSlug(slug);
    setForm({
      slug: category.slug,
      name: category.name,
      blurb: category.blurb ?? "",
      sort_order: String(category.sort_order ?? 0),
    });
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-1 text-2xl font-semibold text-ivory">Categories</h1>
          <p className="mt-1 text-sm text-grey">Organize collections used in the storefront.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-ivory hover:bg-bg-soft"
        >
          <Plus className="size-4" />
          New category
        </button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-ivory">Collections</h2>
            <p className="mt-1 text-sm text-grey">{categoriesData.length} saved collections</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-scroll w-full text-left text-sm">
              <thead className="panel-kicker border-b border-border bg-bg-soft text-xs text-grey">
                <tr>
                  <th className="px-5 py-3 font-medium">Collection</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="w-20 px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoriesData.map((category) => (
                  <tr key={category.slug} className="transition-colors hover:bg-bg-soft">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => startEditing(category.slug)}
                        className="text-left"
                      >
                        <span className="block font-medium text-ivory">{category.name}</span>
                        {category.blurb ? (
                          <span className="mt-1 block text-xs text-grey">{category.blurb}</span>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-grey">{category.sort_order ?? 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(category.slug)}
                          className="rounded p-1.5 text-grey hover:bg-card hover:text-ivory"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Delete the ${category.name} collection?`)) return;
                            try {
                              await adminDeleteCategory({ data: { slug: category.slug } });
                              await Promise.all([
                                queryClient.invalidateQueries({
                                  queryKey: ["admin", "categories"],
                                }),
                                queryClient.invalidateQueries({ queryKey: ["categories"] }),
                              ]);
                              setMessage(`Deleted the ${category.name} collection.`);
                              resetForm();
                            } catch (caught) {
                              setError(
                                caught instanceof Error
                                  ? caught.message
                                  : "Category could not be deleted.",
                              );
                            }
                          }}
                          className="rounded p-1.5 text-grey hover:bg-red-500/10 hover:text-red-600"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categoriesData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-grey">
                      No categories yet. Create one to organise the storefront.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.14em] text-grey-dim">
              {editingCategory ? "Edit category" : "New category"}
            </p>
            <h2 className="mt-1 font-semibold text-ivory">
              {editingCategory ? editingCategory.name : "Collection details"}
            </h2>
          </div>

          {error ? <Notice kind="error">{error}</Notice> : null}
          {message ? <Notice kind="success">{message}</Notice> : null}

          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError(null);
              setMessage(null);
              try {
                await adminUpsertCategory({
                  data: {
                    slug: form.slug.trim(),
                    name: form.name.trim(),
                    blurb: form.blurb.trim(),
                    sort_order: Number(form.sort_order || 0),
                  },
                });
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
                  queryClient.invalidateQueries({ queryKey: ["categories"] }),
                ]);
                setMessage("Category saved.");
                resetForm();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Category could not be saved.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  slug: value.toLowerCase().replace(/\s+/g, "-"),
                }))
              }
              helper="lowercase and dashes"
              required
            />
            <Field
              label="Collection name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <Textarea
              label="Blurb"
              value={form.blurb}
              onChange={(value) => setForm((current) => ({ ...current, blurb: value }))}
              rows={3}
            />
            <Field
              label="Sort order"
              value={form.sort_order}
              type="number"
              onChange={(value) => setForm((current) => ({ ...current, sort_order: value }))}
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? "Saving..." : editingCategory ? "Save changes" : "Create category"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  helper,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex justify-between gap-3 text-sm text-grey">
        <span>{label}</span>
        {helper ? <span className="text-xs text-grey-dim">{helper}</span> : null}
      </span>
      <input
        required={required}
        value={value}
        type={type}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-grey">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
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
