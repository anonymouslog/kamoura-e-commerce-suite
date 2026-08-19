import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminDeleteProduct,
  adminRemoveProductImage,
  adminUpsertProduct,
} from "@/lib/admin.functions";
import { adminProductsQuery } from "@/lib/admin-queries";
import { allColors, allSizes, categories } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/products")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProductsQuery),
  component: Products,
});

type ProductFormState = {
  slug: string;
  name: string;
  category_slug: string;
  price: string;
  description: string;
  details: string;
  sizes: string;
  colors: string;
  stock: string;
  image_key: string;
  image_url: string;
  status: "draft" | "active" | "archived";
  is_featured: boolean;
};

const productImageBucket = "product-images";
const emptyForm = (): ProductFormState => ({
  slug: "", name: "", category_slug: categories[0]?.slug ?? "outerwear", price: "", description: "",
  details: "", sizes: "", colors: "", stock: "0", image_key: "", image_url: "", status: "draft", is_featured: false,
});

function Products() {
  const { data: products } = useSuspenseQuery(adminProductsQuery);
  const [editingSlug, setEditingSlug] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editingProduct = useMemo(() => products.find((product) => product.slug === editingSlug) ?? null, [editingSlug, products]);

  useEffect(() => {
    if (!editingProduct) return;
    setForm({
      slug: editingProduct.slug, name: editingProduct.name ?? "", category_slug: editingProduct.category_slug ?? categories[0]?.slug ?? "outerwear",
      price: String(Number(editingProduct.price ?? 0)), description: editingProduct.description ?? "", details: (editingProduct.details ?? []).join("\n"),
      sizes: (editingProduct.sizes ?? []).join(", "), colors: (editingProduct.colors ?? []).join(", "), stock: String(Number(editingProduct.stock ?? 0)),
      image_key: editingProduct.image_key ?? "", image_url: editingProduct.image_url ?? "", status: editingProduct.status ?? "draft",
      is_featured: Boolean(editingProduct.featured ?? editingProduct.is_featured),
    });
  }, [editingProduct]);

  const resetForm = () => { setEditingSlug(""); setForm(emptyForm()); setMessage(null); setError(null); };
  const startEditing = (slug: string) => { setError(null); setMessage(null); setEditingSlug(slug); };

  const uploadImage = async (file: File) => {
    setError(null); setMessage(null);
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return setError("Use a JPG, PNG, WebP, or AVIF image.");
    if (file.size > 5 * 1024 * 1024) return setError("Images must be 5 MB or smaller.");
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const key = `products/${crypto.randomUUID()}.${extension}`;
    setUploading(true);
    const { error: uploadError } = await supabase.storage.from(productImageBucket).upload(key, file, { cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (uploadError) return setError(uploadError.message);
    const { data } = supabase.storage.from(productImageBucket).getPublicUrl(key);
    setForm((current) => ({ ...current, image_key: key, image_url: data.publicUrl }));
    setMessage("Image uploaded. Save the product to publish this change.");
  };

  const removeImage = async () => {
    if (!form.image_key) { setForm((current) => ({ ...current, image_url: "" })); return; }
    setError(null); setMessage(null); setUploading(true);
    try {
      await adminRemoveProductImage({ data: { image_key: form.image_key, ...(editingSlug ? { slug: editingSlug } : {}) } });
      setForm((current) => ({ ...current, image_key: "", image_url: "" }));
      setMessage("Image removed from storage and the product record.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be removed.");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Catalog</p><h1 className="mt-1 text-2xl font-semibold text-ivory">Products</h1><p className="mt-1 text-sm text-grey">Create, publish, and maintain the store catalog.</p></div>
        <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-ivory hover:bg-bg-soft"><Plus className="size-4" />Create product</button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_29rem]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><h2 className="font-semibold text-ivory">All products</h2><p className="mt-1 text-sm text-grey">{products.length} catalog entries</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-bg-soft text-xs uppercase tracking-[0.12em] text-grey"><tr><th className="px-5 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Collection</th><th className="px-4 py-3 font-medium">Inventory</th><th className="px-4 py-3 font-medium">Status</th><th className="w-20 px-4 py-3" aria-label="Actions" /></tr></thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => <tr key={product.slug} className="transition-colors hover:bg-bg-soft">
                <td className="px-5 py-4"><button type="button" onClick={() => startEditing(product.slug)} className="flex items-center gap-3 text-left"><ProductThumb src={product.image_url} /><span><span className="block font-medium text-ivory">{product.name}</span><span className="mt-1 block text-xs text-grey">₦{Number(product.price).toLocaleString("en-NG")}</span></span></button></td>
                <td className="px-4 py-4 text-grey">{product.category_slug}</td><td className="px-4 py-4 text-grey">{product.stock} in stock</td><td className="px-4 py-4"><Status status={product.status} /></td>
                <td className="px-4 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => startEditing(product.slug)} className="rounded p-1.5 text-grey hover:bg-card hover:text-ivory" aria-label={`Edit ${product.name}`}><Pencil className="size-4" /></button><button type="button" onClick={async () => { if (!confirm(`Delete ${product.name} and its uploaded image?`)) return; try { await adminDeleteProduct({ data: { slug: product.slug } }); location.reload(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Product could not be deleted."); } }} className="rounded p-1.5 text-grey hover:bg-red-500/10 hover:text-red-600" aria-label={`Delete ${product.name}`}><Trash2 className="size-4" /></button></div></td>
              </tr>)}
              {products.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-grey">No products yet. Create your first product.</td></tr> : null}
            </tbody>
          </table></div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-start justify-between border-b border-border px-5 py-4"><div><p className="text-xs uppercase tracking-[0.14em] text-grey-dim">{editingSlug ? "Edit product" : "New product"}</p><h2 className="mt-1 font-semibold text-ivory">{editingSlug ? form.name || "Product details" : "Product details"}</h2></div>{editingSlug ? <button type="button" onClick={resetForm} className="text-sm text-grey hover:text-ivory">Close</button> : null}</div>
          <form className="grid gap-4 p-5" onSubmit={async (event) => {
            event.preventDefault(); setSaving(true); setError(null); setMessage(null);
            try {
              const result = await adminUpsertProduct({ data: { slug: form.slug.trim(), name: form.name.trim(), category_slug: form.category_slug, price: Number(form.price || 0), description: form.description.trim(), details: splitLines(form.details), sizes: splitItems(form.sizes), colors: splitItems(form.colors), stock: Number(form.stock || 0), image_key: form.image_key || null, image_url: form.image_url || null, status: form.status, is_featured: form.is_featured } });
              setMessage(result.imageCleanupWarning ? "Product saved, but the previous image could not be cleared. Try removing it again." : "Product saved."); setTimeout(() => location.reload(), 500);
            } catch (caught) { setError(caught instanceof Error ? caught.message : "Product could not be saved."); } finally { setSaving(false); }
          }}>
            {error ? <Notice kind="error">{error}</Notice> : null}{message ? <Notice kind="success">{message}</Notice> : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><Field label="Product name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required /><Field label="Handle" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value.toLowerCase().replace(/\s+/g, "-") }))} helper="lowercase and dashes" required /><Select label="Collection" value={form.category_slug} options={categories.map((category) => ({ value: category.slug, label: category.name }))} onChange={(value) => setForm((current) => ({ ...current, category_slug: value }))} /><Select label="Status" value={form.status} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Published" }, { value: "archived", label: "Archived" }]} onChange={(value) => setForm((current) => ({ ...current, status: value as ProductFormState["status"] }))} /><Field label="Price (NGN)" value={form.price} type="number" onChange={(value) => setForm((current) => ({ ...current, price: value }))} required /><Field label="In stock" value={form.stock} type="number" onChange={(value) => setForm((current) => ({ ...current, stock: value }))} required /></div>
            <Textarea label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} rows={3} /><Textarea label="Details" helper="One per line" value={form.details} onChange={(value) => setForm((current) => ({ ...current, details: value }))} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><Textarea label="Sizes" helper={allSizes.join(", ")} value={form.sizes} onChange={(value) => setForm((current) => ({ ...current, sizes: value }))} rows={3} /><Textarea label="Colors" helper={allColors.join(", ")} value={form.colors} onChange={(value) => setForm((current) => ({ ...current, colors: value }))} rows={3} /></div>
            <div className="rounded-md border border-border bg-bg-soft p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-ivory">Product image</p><p className="mt-1 text-xs text-grey">JPG, PNG, WebP, or AVIF. Up to 5 MB.</p></div>{form.image_url ? <button type="button" disabled={uploading} onClick={removeImage} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-500 disabled:opacity-50"><Trash2 className="size-4" />Remove</button> : null}</div>{form.image_url ? <div className="mt-4 flex gap-4"><img src={form.image_url} alt="Product preview" className="size-24 rounded border border-border object-cover" /><div className="min-w-0 text-xs text-grey"><p className="font-medium text-ivory">Uploaded image</p><p className="mt-1 break-all">{form.image_key || "External image URL"}</p></div></div> : <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-input bg-card px-4 py-8 text-sm text-grey hover:border-gold hover:text-ivory"><ImagePlus className="size-5" />{uploading ? "Uploading image..." : "Upload product image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label>}{!form.image_url ? <Field label="Or external image URL" value={form.image_url} onChange={(value) => setForm((current) => ({ ...current, image_url: value, image_key: "" }))} helper="Use only if hosted elsewhere" /> : null}</div>
            <label className="flex items-center gap-2 text-sm text-grey"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))} className="size-4 accent-[#c9a05c]" />Feature on homepage</label>
            <button disabled={saving || uploading} className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"><Upload className="size-4" />{saving ? "Saving..." : editingSlug ? "Save changes" : "Create product"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ProductThumb({ src }: { src: string | null }) { return src ? <img src={src} alt="" className="size-10 rounded border border-border object-cover" /> : <span className="flex size-10 items-center justify-center rounded border border-border bg-bg-soft text-grey"><ImagePlus className="size-4" /></span>; }
function Status({ status }: { status: string }) { const color = status === "active" ? "bg-emerald-500" : status === "archived" ? "bg-grey-dim" : "bg-gold"; return <span className="inline-flex items-center gap-2 text-xs capitalize text-grey"><span className={`size-1.5 rounded-full ${color}`} />{status}</span>; }
function Notice({ kind, children }: { kind: "error" | "success"; children: string }) { return <p className={`rounded border px-3 py-2 text-sm ${kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>{children}</p>; }
function splitItems(value: string) { return value.split(/[\n,]/).map((part) => part.trim()).filter(Boolean); }
function splitLines(value: string) { return value.split("\n").map((part) => part.trim()).filter(Boolean); }
function Field({ label, value, onChange, type = "text", helper, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; helper?: string; required?: boolean }) { return <label className="grid gap-1.5"><span className="flex justify-between gap-3 text-sm text-grey"><span>{label}</span>{helper ? <span className="text-xs text-grey-dim">{helper}</span> : null}</span><input required={required} value={value} type={type} min={type === "number" ? 0 : undefined} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><span className="text-sm text-grey">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Textarea({ label, value, onChange, helper, rows }: { label: string; value: string; onChange: (value: string) => void; helper?: string; rows: number }) { return <label className="grid gap-1.5"><span className="flex justify-between gap-3 text-sm text-grey"><span>{label}</span>{helper ? <span className="text-xs text-grey-dim">{helper}</span> : null}</span><textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded border border-input bg-card px-3 py-2 text-sm text-ivory outline-none focus:border-gold" /></label>; }
