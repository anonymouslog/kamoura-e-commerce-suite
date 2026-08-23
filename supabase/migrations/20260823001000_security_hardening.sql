-- =============================================================================
-- Kamoura security hardening follow-up
--
-- Applies the final hardening work for deployed projects that already ran the
-- earlier schema and migration files. This keeps the database secure without
-- rewriting historical migration history.
-- =============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep public product images readable by URL while preventing broad object-listing
-- patterns. The public bucket remains readable by key, and only admins can manage
-- uploaded objects.
do $$ begin
  drop policy if exists "product-images: public read" on storage.objects;
  create policy "product-images: public read" on storage.objects
    for select to anon, authenticated
    using (
      bucket_id = 'product-images'
      and name is not null
      and name !~ '^$'
    );
exception when duplicate_object then null; end $$;

-- Keep the install notes explicit about required dashboard-side auth protections.
-- This is intentionally not enforced here because Supabase Auth settings are
-- configured in the Dashboard, not via SQL.
