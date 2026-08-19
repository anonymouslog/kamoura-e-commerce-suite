-- =============================================================================
-- Kamoura private role helper migration
--
-- Safe for an existing database. This only moves the role-check helper out of
-- the exposed public schema and repoints admin policies to the private helper.
-- =============================================================================

create schema if not exists app_private;

create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = app_private, public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant execute on function app_private.has_role(uuid, public.app_role) to authenticated;

do $$ begin
  drop policy if exists "user_roles: admins manage" on public.user_roles;
  create policy "user_roles: admins manage" on public.user_roles
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "categories: admins write" on public.categories;
  create policy "categories: admins write" on public.categories
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "products: admins all" on public.products;
  create policy "products: admins all" on public.products
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "addresses: own" on public.addresses;
  create policy "addresses: own" on public.addresses
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "orders: admins all" on public.orders;
  create policy "orders: admins all" on public.orders
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "order_items: admins all" on public.order_items;
  create policy "order_items: admins all" on public.order_items
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "order_events: admins all" on public.order_events;
  create policy "order_events: admins all" on public.order_events
    for all to authenticated
    using (app_private.has_role(auth.uid(), 'admin'))
    with check (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "wishlist: own" on public.wishlist_items;
  create policy "wishlist: own" on public.wishlist_items
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  drop policy if exists "newsletter: admins read" on public.newsletter_signups;
  create policy "newsletter: admins read" on public.newsletter_signups
    for select to authenticated
    using (app_private.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

drop function if exists public.has_role(uuid, public.app_role);
