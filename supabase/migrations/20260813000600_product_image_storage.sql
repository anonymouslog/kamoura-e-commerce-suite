-- =============================================================================
-- Kamoura product image storage
--
-- Creates a public delivery bucket for storefront images. Only the admin role
-- can create, replace, or remove objects; public visitors can only read them.
-- Product records retain the object path in products.image_key so the app can
-- remove the corresponding object whenever an image or product is deleted.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  drop policy if exists "product-images: public read" on storage.objects;
  create policy "product-images: public read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'product-images');
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "product-images: admins upload" on storage.objects;
  create policy "product-images: admins upload" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'product-images'
      and app_private.has_role(auth.uid(), 'admin')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "product-images: admins update" on storage.objects;
  create policy "product-images: admins update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'product-images'
      and app_private.has_role(auth.uid(), 'admin')
    )
    with check (
      bucket_id = 'product-images'
      and app_private.has_role(auth.uid(), 'admin')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "product-images: admins delete" on storage.objects;
  create policy "product-images: admins delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'product-images'
      and app_private.has_role(auth.uid(), 'admin')
    );
exception when duplicate_object then null; end $$;
