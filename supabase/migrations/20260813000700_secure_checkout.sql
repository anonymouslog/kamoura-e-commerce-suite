-- =============================================================================
-- Kamoura secure checkout
--
-- Orders must be created through the server-side service-role client. This
-- function locks each product row, derives all monetary values from the
-- catalogue, decrements stock atomically, and writes the order plus its items
-- in one database transaction.
-- =============================================================================

drop policy if exists "orders: create own" on public.orders;
drop policy if exists "orders: create guest" on public.orders;
drop policy if exists "order_items: create own" on public.order_items;
drop policy if exists "order_items: create guest" on public.order_items;

create table if not exists public.checkout_rate_limits (
  request_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);
alter table public.checkout_rate_limits enable row level security;

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
  request_count_in_window integer;
begin
  if p_channel not in ('whatsapp', 'email') then
    raise exception 'Invalid notification channel.';
  end if;

  calculated_shipping := case p_shipping_method
    when 'standard' then 4500
    when 'express' then 9500
    when 'pickup' then 0
    else null
  end;
  if calculated_shipping is null then
    raise exception 'Invalid shipping method.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.';
  end if;
  if char_length(p_request_key) < 16 then
    raise exception 'Invalid checkout request.';
  end if;

  insert into public.checkout_rate_limits (request_key, window_started_at, request_count)
  values (p_request_key, date_trunc('minute', now()), 1)
  on conflict (request_key) do update
  set
    window_started_at = case
      when public.checkout_rate_limits.window_started_at < date_trunc('minute', now())
        then date_trunc('minute', now())
      else public.checkout_rate_limits.window_started_at
    end,
    request_count = case
      when public.checkout_rate_limits.window_started_at < date_trunc('minute', now()) then 1
      else public.checkout_rate_limits.request_count + 1
    end,
    updated_at = now()
  returning request_count into request_count_in_window;

  if request_count_in_window > 5 then
    raise exception 'Too many order attempts. Please wait a minute and try again.';
  end if;

  create temporary table checkout_items (
    slug text not null,
    size text not null,
    color text not null,
    quantity integer not null check (quantity between 1 and 10),
    primary key (slug, size, color)
  ) on commit drop;

  insert into checkout_items (slug, size, color, quantity)
  select
    item.slug,
    item.size,
    item.color,
    sum(item.quantity)::integer
  from jsonb_to_recordset(p_items) as item(
    slug text,
    size text,
    color text,
    quantity integer
  )
  group by item.slug, item.size, item.color;

  for requested_item in select * from checkout_items order by slug loop
    select *
    into product_row
    from public.products
    where slug = requested_item.slug
      and status = 'active'
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

    update public.products
    set stock = stock - requested_item.quantity
    where id = product_row.id;

    calculated_subtotal := calculated_subtotal + (product_row.base_price * requested_item.quantity);
  end loop;

  order_reference := format(
    'KMR-%s-%s',
    to_char(clock_timestamp(), 'YYMMDD'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  insert into public.orders (
    reference,
    user_id,
    status,
    contact_name,
    contact_phone,
    contact_email,
    shipping_address,
    shipping_method,
    subtotal,
    shipping_cost,
    total,
    customer_note,
    notified_channel,
    notified_at
  ) values (
    order_reference,
    p_user_id,
    'placed',
    p_contact_name,
    p_contact_phone,
    lower(trim(p_contact_email)),
    p_shipping_address,
    p_shipping_method,
    calculated_subtotal,
    calculated_shipping,
    calculated_subtotal + calculated_shipping,
    nullif(trim(p_customer_note), ''),
    null,
    null
  ) returning orders.id into order_id;

  insert into public.order_items (
    order_id,
    product_slug,
    product_name,
    variant_label,
    quantity,
    unit_price_at_purchase,
    image_url
  )
  select
    order_id,
    product_row.slug,
    product_row.name,
    requested_item.size || ' / ' || requested_item.color,
    requested_item.quantity,
    product_row.base_price,
    product_row.image_url
  from checkout_items requested_item
  join public.products product_row on product_row.slug = requested_item.slug;

  insert into public.order_events (order_id, status, note)
  values (order_id, 'placed', 'Order placed by customer.');

  return query
  select order_id, order_reference, calculated_subtotal, calculated_shipping, calculated_subtotal + calculated_shipping;
end;
$$;

revoke all on function public.create_checkout_order(uuid, text, text, text, text, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.create_checkout_order(uuid, text, text, text, text, text, text, jsonb, jsonb, text)
  to service_role;
