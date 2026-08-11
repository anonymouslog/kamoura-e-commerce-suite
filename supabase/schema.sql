-- =============================================================================
-- KAMOURA — Supabase schema (run this once when you connect a project)
--
-- Nothing in the app talks to Supabase yet. This file is the migration to run
-- in the Supabase SQL editor (or as supabase/migrations/0001_init.sql) when you
-- are ready. Order matters: table -> grants -> RLS -> policies.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'staff', 'customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'placed', 'confirmed', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled'
  );
exception when duplicate_object then null; end $$;

-- ---------- helper: updated_at ------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid());

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- roles (NEVER store roles on profiles) ----------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "user_roles: read own" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "user_roles: admins manage" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- catalogue --------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  blurb text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories: public read" on public.categories for select to anon, authenticated using (true);
create policy "categories: admins write" on public.categories
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  details text[] not null default '{}',
  base_price numeric(12,2) not null check (base_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products: public read active" on public.products
  for select to anon, authenticated using (status = 'active');
create policy "products: admins all" on public.products
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  sku text not null unique,
  price_override numeric(12,2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  unique (product_id, size, color)
);
grant select on public.product_variants to anon, authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "variants: public read" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "variants: admins all" on public.product_variants
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  storage_path text not null,           -- path inside the 'product-images' bucket
  alt_text text not null default '',
  sort_order int not null default 0
);
grant select on public.product_images to anon, authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "images: public read" on public.product_images
  for select to anon, authenticated using (true);
create policy "images: admins all" on public.product_images
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- carts ------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_token text unique,            -- guest bag, held in an httpOnly cookie
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.carts to authenticated;
grant all on public.carts to service_role;
alter table public.carts enable row level security;
create policy "carts: own" on public.carts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  unique (cart_id, variant_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "cart_items: own" on public.cart_items
  for all to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ---------- addresses --------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text,
  country text not null default 'Nigeria',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "addresses: own" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- orders -----------------------------------------------------------
-- No payment provider: an order is delivered to the studio over WhatsApp/email.
-- notified_channel records how it was handed over.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,       -- KMR-260811-A1B2
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'placed',
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  shipping_address jsonb not null,      -- snapshot, not a live join
  shipping_method text not null,
  subtotal numeric(12,2) not null,
  shipping_cost numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  customer_note text,
  notified_channel text check (notified_channel in ('whatsapp', 'email')),
  notified_at timestamptz,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders: read own" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "orders: create own" on public.orders
  for insert to authenticated with check (user_id = auth.uid());
create policy "orders: admins all" on public.orders
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Price is snapshotted here. Never join back to live product price for history.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text not null,          -- 'M / Ivory'
  sku text,
  quantity int not null check (quantity > 0),
  unit_price_at_purchase numeric(12,2) not null
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order_items: read own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items: admins all" on public.order_items
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- order status timeline -------------------------------------------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.order_events to authenticated;
grant all on public.order_events to service_role;
alter table public.order_events enable row level security;
create policy "order_events: read own" on public.order_events
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_events: admins all" on public.order_events
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- wishlist ---------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
alter table public.wishlist_items enable row level security;
create policy "wishlist: own" on public.wishlist_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- newsletter -------------------------------------------------------
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_signups to anon, authenticated;
grant all on public.newsletter_signups to service_role;
alter table public.newsletter_signups enable row level security;
create policy "newsletter: anyone may sign up" on public.newsletter_signups
  for insert to anon, authenticated with check (true);
create policy "newsletter: admins read" on public.newsletter_signups
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------- indexes ----------------------------------------------------------
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists variants_product_idx on public.product_variants(product_id);
create index if not exists images_product_idx on public.product_images(product_id);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- storage ----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy "product images: admins write"
  on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
