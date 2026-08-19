-- =============================================================================
-- Kamoura order notification log
--
-- Server-side delivery attempts are retained for operational troubleshooting.
-- No browser role can read or write this table; the service-role server client
-- records the result after attempting Resend or an automation webhook.
-- =============================================================================

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email')),
  provider text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.order_notifications enable row level security;

create index if not exists order_notifications_order_idx
  on public.order_notifications (order_id, created_at desc);
