-- =============================================================================
-- Kamoura Supabase baseline schema
--
-- Apply this to a fresh Supabase project. It is idempotent enough for repeated
-- runs on a clean database, but it is not a destructive reset script.
-- =============================================================================

create extension if not exists "pgcrypto";

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

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

do $$ begin
  create policy "profiles: read own" on public.profiles
    for select to authenticated using (id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles: insert own" on public.profiles
    for insert to authenticated with check (id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles: update own" on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
exception when duplicate_object then null; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

do $$ begin
  create policy "user_roles: read own" on public.user_roles
    for select to authenticated using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_roles: admins manage" on public.user_roles
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  blurb text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0
);
alter table public.categories enable row level security;

do $$ begin
  create policy "categories: public read" on public.categories
    for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "categories: admins write" on public.categories
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  details text[] not null default '{}',
  base_price numeric(12,2) not null check (base_price >= 0),
  category_slug text not null references public.categories(slug) on update cascade on delete restrict,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock int not null default 0 check (stock >= 0),
  image_key text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

do $$ begin
  create policy "products: public read active" on public.products
    for select to anon, authenticated using (status = 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "products: admins all" on public.products
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

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
alter table public.addresses enable row level security;

do $$ begin
  create policy "addresses: own" on public.addresses
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'placed',
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  shipping_address jsonb not null,
  shipping_method text not null,
  subtotal numeric(12,2) not null,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  customer_note text,
  notified_channel text check (notified_channel in ('whatsapp', 'email')),
  notified_at timestamptz,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;

do $$ begin
  create policy "orders: read own" on public.orders
    for select to authenticated using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "orders: create own" on public.orders
    for insert to authenticated
    with check (user_id = auth.uid() or user_id is null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "orders: create guest" on public.orders
    for insert to anon
    with check (user_id is null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "orders: admins all" on public.orders
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text references public.products(slug) on update cascade on delete set null,
  product_name text not null,
  variant_label text not null,
  quantity int not null check (quantity > 0),
  unit_price_at_purchase numeric(12,2) not null,
  image_url text
);
alter table public.order_items enable row level security;

do $$ begin
  create policy "order_items: read own" on public.order_items
    for select to authenticated using (
      exists (
        select 1
        from public.orders o
        where o.id = order_id and o.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_items: create own" on public.order_items
    for insert to authenticated
    with check (
      exists (
        select 1
        from public.orders o
        where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null)
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_items: create guest" on public.order_items
    for insert to anon
    with check (
      exists (
        select 1
        from public.orders o
        where o.id = order_id and o.user_id is null
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_items: admins all" on public.order_items
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.order_events enable row level security;

do $$ begin
  create policy "order_events: read own" on public.order_events
    for select to authenticated using (
      exists (
        select 1
        from public.orders o
        where o.id = order_id and o.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_events: admins all" on public.order_events
    for all to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_slug text not null references public.products(slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_slug)
);
alter table public.wishlist_items enable row level security;

do $$ begin
  create policy "wishlist: own" on public.wishlist_items
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.newsletter_signups enable row level security;

do $$ begin
  create policy "newsletter: anyone signs up" on public.newsletter_signups
    for insert to anon, authenticated with check (
      email = lower(trim(email))
      and email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      and char_length(email) between 5 and 160
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "newsletter: admins read" on public.newsletter_signups
    for select to authenticated using (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_sort_idx on public.categories(sort_order);
create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_featured_idx on public.products(is_featured, status);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists wishlist_user_idx on public.wishlist_items(user_id);

insert into public.categories (slug, name, blurb, sort_order)
values
  ('outerwear', 'Outerwear', 'Coats cut long and unhurried.', 1),
  ('knitwear', 'Knitwear', 'Cashmere and merino, nothing louder.', 2),
  ('shirting', 'Shirting', 'Silk and poplin, softly structured.', 3),
  ('trousers', 'Trousers', 'Wool tailoring with a clean break.', 4)
on conflict (slug) do nothing;

insert into public.products (
  slug,
  name,
  description,
  details,
  base_price,
  category_slug,
  status,
  is_featured,
  sizes,
  colors,
  stock,
  image_key,
  image_url
)
values
  (
    'atlas-wool-overcoat',
    'Atlas Wool Overcoat',
    'A single-breasted overcoat in double-faced Italian wool, cut a little longer than the body asks for. Unlined shoulders keep the drape quiet.',
    array['92% virgin wool, 8% cashmere', 'Horn buttons', 'Made in Portugal'],
    389000,
    'outerwear',
    'active',
    true,
    array['XS', 'S', 'M', 'L', 'XL'],
    array['Black', 'Charcoal'],
    6,
    'p4',
    null
  ),
  (
    'lune-silk-shirt',
    'Lune Silk Shirt',
    'Sand-washed silk with a relaxed collar and a slightly dropped shoulder. It creases; that is the point.',
    array['100% mulberry silk', 'Mother-of-pearl buttons', 'Cold hand wash'],
    148000,
    'shirting',
    'active',
    true,
    array['XS', 'S', 'M', 'L'],
    array['Ivory', 'Bone'],
    11,
    'p1',
    null
  ),
  (
    'meridian-cashmere-knit',
    'Meridian Cashmere Knit',
    'Grade-A Mongolian cashmere knitted at a mid gauge, with a rib collar that holds its shape through the season.',
    array['100% cashmere', 'Mid-gauge knit', 'Made in Scotland'],
    212000,
    'knitwear',
    'active',
    true,
    array['S', 'M', 'L', 'XL'],
    array['Camel', 'Fog'],
    9,
    'p3',
    null
  ),
  (
    'solstice-wool-trouser',
    'Solstice Wool Trouser',
    'A high-rise trouser in tropical wool with a single forward pleat and a full break at the ankle.',
    array['Tropical wool', 'Hook-and-bar closure', 'Unfinished hem on request'],
    164000,
    'trousers',
    'active',
    true,
    array['28', '30', '32', '34', '36'],
    array['Charcoal', 'Black'],
    14,
    'p2',
    null
  ),
  (
    'harbour-poplin-shirt',
    'Harbour Poplin Shirt',
    'Compact cotton poplin, cut boxy through the body. The everyday shirt in the house rotation.',
    array['Egyptian cotton poplin', 'Single-needle side seams'],
    96000,
    'shirting',
    'active',
    false,
    array['XS', 'S', 'M', 'L', 'XL'],
    array['Ivory'],
    22,
    'p1',
    null
  ),
  (
    'nocturne-tailored-trouser',
    'Nocturne Tailored Trouser',
    'A narrower cousin to the Solstice, in a matte wool that reads almost black under most light.',
    array['Super 110s wool', 'Flat front', 'Made in Italy'],
    178000,
    'trousers',
    'active',
    false,
    array['30', '32', '34', '36'],
    array['Black'],
    7,
    'p2',
    null
  ),
  (
    'vesper-merino-crew',
    'Vesper Merino Crew',
    'Fine merino with a close crew neck — the layer that disappears under a coat.',
    array['Extra-fine merino', 'Fully fashioned sleeves'],
    118000,
    'knitwear',
    'active',
    false,
    array['S', 'M', 'L'],
    array['Camel', 'Black'],
    0,
    'p3',
    null
  ),
  (
    'eclipse-belted-coat',
    'Eclipse Belted Coat',
    'A wrap coat with a self belt and no visible closure, in a brushed wool that softens with wear.',
    array['Brushed wool blend', 'Self belt', 'Made in Portugal'],
    425000,
    'outerwear',
    'active',
    false,
    array['XS', 'S', 'M', 'L'],
    array['Ivory', 'Black'],
    4,
    'p4',
    null
  )
on conflict (slug) do nothing;
