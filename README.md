# Kamoura E-Commerce Suite

# Kamoura — Next.js E‑Commerce Build Prompt

Copy everything below into Claude Code (or your AI coding tool of choice) as the initial project prompt. It's written to be handed over as-is.

---

## PROMPT START

You are building **Kamoura**, a premium clothing e-commerce storefront. Build a production-grade Next.js application — not a prototype. Follow professional engineering practice throughout: typed code, validated inputs, proper error states, tests where it matters, and a clear path to deployment.

### Brand identity (do not deviate without asking)

Kamoura is a quiet-luxury clothing label. Its mark is a serif wordmark with a crescent moon inside the "O" and a thin gold arc with a single star above it, on near-black.

- **Colors:** `--bg:#050505` (near-black), `--bg-soft:#0b0b0a`, `--gold:#c9a05c`, `--gold-soft:#8a713f`, `--ivory:#f3efe6`, `--grey:#8c8c86`, `--grey-dim:#55554f`, `--silver:#c4c7cc`

- **Typography:** Display/headline face = Cormorant Garamond (serif, used italic for emphasis). Body/UI face = Inter. Use a tabular-figures-friendly mono (IBM Plex Mono) only for order numbers, SKUs, and prices in dense tables.

- **Tone of voice:** restrained, plain, confident — never salesy or exclamation-heavy. Buttons say what they do ("Add to bag," "Place order"), not generic verbs ("Submit," "Buy now!!").

- **Visual restraint:** one signature moment per page (not per section). Avoid gradient-heavy cards, emoji, rounded-pill buttons everywhere, or the generic "AI SaaS" look. Sharp-ish corners (2–4px radius), hairline borders at low opacity, generous whitespace, no drop shadows except on the topmost elevation layer (modals, dropdowns).

### Tech stack

- **Framework:** Next.js 15, App Router, TypeScript strict mode

- **Styling:** Tailwind CSS + shadcn/ui primitives (customized to the token system above — do not ship shadcn's default zinc/slate theme)

- **Auth + DB:** Supabase (Postgres + Supabase Auth). Use Row Level Security on every table from the start — no table should be readable/writable without an explicit policy.

- **Payments:** Stripe Checkout (redirect flow) for v1. Structure the payment layer behind an interface so a second provider (e.g. Paystack, for Nigerian cards) could be added later without touching UI code.

- **Images:** next/image with a placeholder blur strategy; product images served from Supabase Storage.

- **Validation:** Zod schemas shared between client forms and server actions/route handlers.

- **State:** Server Components + Server Actions as the default; client state (cart, filters) via a small Zustand store or React context — justify whichever you pick.

- **Testing:** Playwright for the checkout happy path and auth flows at minimum.

### Site map

**Public**

- `/` — home: hero, featured collection, editorial imagery, email capture

- `/shop` — full catalog with filters (category, size, color, price) and sort

- `/shop/[category]` — category listing

- `/product/[slug]` — product detail: gallery, size/color selector, stock status, add-to-bag, related products

- `/bag` — cart review, quantity edit, promo code, order summary

- `/checkout` — shipping address, shipping method, order review → hands off to Stripe Checkout

- `/checkout/success` and `/checkout/cancelled`

- `/about`, `/contact`

**Auth**

- `/login`, `/signup`, `/forgot-password`, `/reset-password` — Supabase Auth, email+password and magic link

**Customer dashboard** (`/account/*`, protected)

- `/account` — overview: recent orders, saved addresses, account details

- `/account/orders` — order history list

- `/account/orders/[id]` — order detail with status timeline (placed → paid → fulfilled → shipped → delivered) and tracking link

- `/account/addresses` — CRUD for saved shipping addresses

- `/account/wishlist` — saved items

- `/account/settings` — profile, password, email preferences

**Admin** (`/admin/*`, protected by role, separate from customer dashboard — do not blend the two visual languages)

- `/admin` — sales overview

- `/admin/products` — product CRUD, inventory, variants (size/color combinations with independent stock)

- `/admin/orders` — order list, status updates, fulfillment

- `/admin/customers` — customer list

### Data model (Supabase/Postgres — adapt as needed but keep these entities)

- `products` (id, slug, name, description, base_price, category_id, status, created_at)

- `product_variants` (id, product_id, size, color, sku, price_override, stock_quantity)

- `product_images` (id, product_id, variant_id nullable, storage_path, alt_text, sort_order)

- `categories` (id, slug, name, parent_id nullable)

- `carts` (id, user_id nullable for guest via session token, created_at)

- `cart_items` (id, cart_id, variant_id, quantity)

- `orders` (id, user_id, status, subtotal, shipping_cost, total, stripe_session_id, created_at)

- `order_items` (id, order_id, variant_id, quantity, unit_price_at_purchase)

- `addresses` (id, user_id, label, recipient_name, line1, line2, city, state, postal_code, country, is_default)

- `profiles` (id references auth.users, full_name, phone, marketing_opt_in)

Snapshot the price on `order_items` at purchase time — never join back to live product price for historical orders.

### Checkout flow requirements

1. Cart persists for guests via a session-scoped cart id (cookie) and merges into the user's cart on login.

2. Stock is checked (and soft-reserved for a short window, or re-validated) before Stripe session creation — never let checkout proceed on an out-of-stock variant.

3. Use Stripe webhooks (not just the success redirect) to mark an order paid — the redirect is a UX convenience, the webhook is the source of truth.

4. Order confirmation email on successful payment (stub the email provider behind an interface; Resend is a reasonable default given prior project usage).

5. Handle: card decline, session expiry, webhook failure/retry, partial stock changes between cart and payment.

### Non-functional requirements

- Fully responsive from 360px to 1920px; the mobile cart/checkout flow gets equal design attention to desktop, not an afterthought.

- Visible keyboard focus states throughout; checkout form fully usable via keyboard.

- `prefers-reduced-motion` respected — cut ambient/decorative animation when set.

- Core Web Vitals: images sized/optimized, no layout shift on product grid load, route-level loading states via `loading.tsx`.

- SEO: proper metadata per product/category page, OpenGraph images, sitemap.xml, structured data (Product schema) on PDPs.

- Empty and error states are written in-interface, not generic ("Your bag is empty — browse the new arrivals" not "No items found").

### Build sequence (do this in order, confirm before moving to the next phase)

1. Project scaffold, design tokens (Tailwind config + CSS variables), typography, base shadcn components restyled to the brand

2. Supabase schema + RLS policies + type generation

3. Product catalog (public pages) with static/ISR data fetching

4. Cart (client + server sync)

5. Auth (signup/login/reset) and customer dashboard shell

6. Checkout + Stripe integration + webhooks

7. Order history and order detail views

8. Admin product/order management

9. Playwright tests for auth + checkout

10. Deployment guide (Vercel + Supabase production config, environment variable checklist, RLS review pass)

Ask me clarifying questions before phase 1 only if something above is genuinely ambiguous — otherwise proceed with sensible, stated defaults and flag assumptions inline in code comments.

## PROMPT END

---

i will not be using any payment integration for now, instead i will use an order system that when a client orders, the order comes to my whatsapp or a gmail account i will provide later, also the supabase should not connect, just write down the schema so i can easily connect later to supabase and run migration,

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d8d7500-d5b7-4f36-bc75-627d14aefcdd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
