# Kamoura — backend notes

The storefront currently runs with **no backend**: the catalogue lives in
`src/lib/catalog.ts`, the bag lives in `localStorage`, and a placed order opens a
prepared WhatsApp message (or email draft) to the studio.

## When you connect a database

1. Enable Lovable Cloud (or paste `schema.sql` into the Supabase SQL editor as
   the first migration). It is written to run top-to-bottom: table → grants →
   RLS → policies.
2. Upload product photography to the `product-images` bucket and insert
   `categories`, `products`, `product_variants`, `product_images`.
3. Replace `src/lib/catalog.ts` with queries — the exported helpers
   (`products`, `getProduct`, `byCategory`, `featured`, `related`) are the only
   surface the pages use, so the swap is contained.
4. `src/lib/cart.tsx` is where guest-bag persistence and merge-on-login would
   hook into `carts` / `cart_items`.
5. On placing an order, insert `orders` + `order_items` (price is snapshotted on
   the item — never join back to live prices) and keep the WhatsApp/email
   handover, recording `notified_channel` and `notified_at`.

## Order routing

`src/lib/store-config.ts` holds the WhatsApp number and Gmail address. Both are
placeholders — replace them with the real destinations and nothing else needs to
change.
