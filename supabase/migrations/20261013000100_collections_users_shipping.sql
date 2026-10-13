-- Collections are editable by admins but are intentionally never deletable.
drop policy if exists "categories: admins write" on public.categories;
drop policy if exists "categories: admins insert" on public.categories;
drop policy if exists "categories: admins update" on public.categories;

create policy "categories: admins insert" on public.categories
  for insert to authenticated
  with check (app_private.has_role(auth.uid(), 'admin'));

create policy "categories: admins update" on public.categories
  for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

create or replace function public.prevent_collection_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Collections cannot be deleted.';
end
$$;

drop trigger if exists categories_prevent_delete on public.categories;
create trigger categories_prevent_delete
  before delete on public.categories
  for each row execute function public.prevent_collection_delete();

create table if not exists public.store_shipping_config (
  id boolean primary key default true check (id),
  dispatch_state text not null check (char_length(trim(dispatch_state)) between 2 and 80),
  same_state_fee numeric(12,2) not null check (same_state_fee >= 0),
  interstate_fee numeric(12,2) not null check (interstate_fee >= 0),
  updated_at timestamptz not null default now()
);
alter table public.store_shipping_config enable row level security;

drop policy if exists "shipping config: public read" on public.store_shipping_config;
create policy "shipping config: public read" on public.store_shipping_config
  for select to anon, authenticated using (true);

drop policy if exists "shipping config: admins insert" on public.store_shipping_config;
create policy "shipping config: admins insert" on public.store_shipping_config
  for insert to authenticated
  with check (app_private.has_role(auth.uid(), 'admin'));

drop policy if exists "shipping config: admins update" on public.store_shipping_config;
create policy "shipping config: admins update" on public.store_shipping_config
  for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

drop trigger if exists store_shipping_config_touch on public.store_shipping_config;
create trigger store_shipping_config_touch before update on public.store_shipping_config
  for each row execute function public.touch_updated_at();

create or replace function public.create_checkout_order(
  p_user_id uuid,
  p_channel text,
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_shipping_method text,
  p_customer_note text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_request_key text
)
returns table (
  id uuid,
  reference text,
  subtotal numeric,
  shipping_cost numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_item record;
  product_row public.products%rowtype;
  order_id uuid;
  order_reference text;
  calculated_subtotal numeric(12,2) := 0;
  calculated_shipping numeric(12,2);
  dispatch_state_value text;
  destination_state text;
  same_state_fee_value numeric(12,2);
  interstate_fee_value numeric(12,2);
  expected_shipping_method text;
begin
  if p_channel not in ('whatsapp', 'email') then
    raise exception 'Invalid notification channel.';
  end if;

  select dispatch_state, same_state_fee, interstate_fee
    into dispatch_state_value, same_state_fee_value, interstate_fee_value
    from public.store_shipping_config
    where id = true
    for share;
  if not found then
    raise exception 'Shipping is not configured. Please contact the store.';
  end if;

  destination_state := nullif(lower(trim(p_shipping_address->>'state')), '');
  if destination_state is null then
    raise exception 'A delivery state is required.';
  end if;

  if destination_state = lower(trim(dispatch_state_value)) then
    expected_shipping_method := 'same_state';
    calculated_shipping := same_state_fee_value;
  else
    expected_shipping_method := 'interstate_waybill';
    calculated_shipping := interstate_fee_value;
  end if;
  if p_shipping_method is distinct from expected_shipping_method then
    raise exception 'The selected delivery method does not match the delivery state.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.';
  end if;
  if char_length(p_request_key) < 16 then
    raise exception 'Invalid checkout request.';
  end if;

  create temporary table checkout_items (
    slug text not null,
    size text not null,
    color text not null,
    quantity integer not null check (quantity between 1 and 10),
    primary key (slug, size, color)
  ) on commit drop;

  insert into checkout_items (slug, size, color, quantity)
  select item.slug, item.size, item.color, sum(item.quantity)::integer
    from jsonb_to_recordset(p_items) as item(
      slug text, size text, color text, quantity integer
    )
    group by item.slug, item.size, item.color;

  for requested_item in select * from checkout_items order by slug loop
    select *
      into product_row
      from public.products
      where slug = requested_item.slug and status = 'active'
      for update;

    if not found then
      raise exception 'A product in your bag is no longer available.';
    end if;
    if product_row.stock < requested_item.quantity then
      raise exception '% is no longer available in that quantity.', product_row.name;
    end if;
    if cardinality(product_row.sizes) > 0 and not requested_item.size = any(product_row.sizes) then
      raise exception 'That size is no longer available for %.', product_row.name;
    end if;
    if cardinality(product_row.colors) > 0 and not requested_item.color = any(product_row.colors) then
      raise exception 'That colour is no longer available for %.', product_row.name;
    end if;

    update public.products set stock = stock - requested_item.quantity where id = product_row.id;
    calculated_subtotal := calculated_subtotal + (product_row.base_price * requested_item.quantity);
  end loop;

  order_reference := format(
    'KMR-%s-%s',
    to_char(clock_timestamp(), 'YYMMDD'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  insert into public.orders (
    reference, user_id, status, contact_name, contact_phone, contact_email,
    shipping_address, shipping_method, subtotal, shipping_cost, total,
    customer_note, notified_channel, notified_at
  ) values (
    order_reference, p_user_id, 'placed', p_contact_name, p_contact_phone,
    lower(trim(p_contact_email)), p_shipping_address, p_shipping_method,
    calculated_subtotal, calculated_shipping, calculated_subtotal + calculated_shipping,
    nullif(trim(p_customer_note), ''), null, null
  ) returning orders.id into order_id;

  insert into public.order_items (
    order_id, product_slug, product_name, variant_label, quantity,
    unit_price_at_purchase, image_url
  )
  select
    order_id, product_row.slug, product_row.name,
    requested_item.size || ' / ' || requested_item.color,
    requested_item.quantity, product_row.base_price, product_row.image_url
  from checkout_items requested_item
  join public.products product_row on product_row.slug = requested_item.slug;

  insert into public.order_events (order_id, status, note)
  values (order_id, 'placed', 'Order placed by customer.');

  return query
  select order_id, order_reference, calculated_subtotal, calculated_shipping,
    calculated_subtotal + calculated_shipping;
end;
$$;

revoke all on function public.create_checkout_order(uuid, text, text, text, text, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.create_checkout_order(uuid, text, text, text, text, text, text, jsonb, jsonb, text)
  to service_role;
