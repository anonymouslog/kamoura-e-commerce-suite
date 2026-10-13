/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"] || "http://127.0.0.1:54321";
const anonKey =
  process.env["SUPABASE_PUBLISHABLE_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.test";
const serviceRoleKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.test";

describe("RPC checkout integration suite", () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;
  let supabaseAvailable = false;
  let shippingConfiguration: {
    dispatch_state: string;
    same_state_fee: number;
    interstate_fee: number;
  } | null = null;

  const sameStateAddress = {
    line1: "Street",
    city: "Dispatch City",
    get state() {
      return shippingConfiguration?.dispatch_state ?? "Lagos";
    },
    country: "Nigeria",
  };

  it("creates, edits, reassigns, and deletes a product record", async ({ skip }) => {
    if (!supabaseAvailable) skip();

    const originalSlug = `test-product-${Date.now()}`;
    const updatedSlug = `${originalSlug}-edited`;
    const { error: createError } = await adminClient.from("products").insert({
      slug: originalSlug,
      name: "Product CRUD Test",
      category_slug: "outerwear",
      base_price: 1000,
      description: "Initial description",
      details: ["Initial detail"],
      sizes: ["M"],
      colors: ["Black"],
      stock: 3,
      status: "draft",
      is_featured: false,
    });
    expect(createError).toBeNull();

    try {
      const { error: updateError } = await adminClient
        .from("products")
        .update({
          slug: updatedSlug,
          name: "Edited Product CRUD Test",
          category_slug: "knitwear",
          base_price: 1200,
          description: "Updated description",
          details: ["Updated detail"],
          sizes: ["L"],
          colors: ["Ivory"],
          stock: 8,
          status: "active",
          is_featured: true,
        })
        .eq("slug", originalSlug);
      expect(updateError).toBeNull();

      const { data: product, error: readError } = await adminClient
        .from("products")
        .select(
          "slug,name,category_slug,base_price,description,details,sizes,colors,stock,status,is_featured",
        )
        .eq("slug", updatedSlug)
        .single();
      expect(readError).toBeNull();
      expect(product).toMatchObject({
        slug: updatedSlug,
        name: "Edited Product CRUD Test",
        category_slug: "knitwear",
        base_price: 1200,
        description: "Updated description",
        details: ["Updated detail"],
        sizes: ["L"],
        colors: ["Ivory"],
        stock: 8,
        status: "active",
        is_featured: true,
      });

      const { error: deleteError } = await adminClient
        .from("products")
        .delete()
        .eq("slug", updatedSlug);
      expect(deleteError).toBeNull();
    } finally {
      await adminClient.from("products").delete().in("slug", [originalSlug, updatedSlug]);
    }
  });

  beforeAll(async () => {
    try {
      adminClient = createClient(supabaseUrl, serviceRoleKey);
      anonClient = createClient(supabaseUrl, anonKey);
      const { error } = await adminClient.from("products").select("id").limit(1);
      supabaseAvailable = !error;
      if (supabaseAvailable) {
        const { data } = await adminClient
          .from("store_shipping_config")
          .select("dispatch_state,same_state_fee,interstate_fee")
          .eq("id", true)
          .maybeSingle();
        shippingConfiguration = data;
      }
    } catch {
      supabaseAvailable = false;
    }
  });

  it("denies direct insert into orders and order_items with anon key (RLS)", async ({ skip }) => {
    if (!supabaseAvailable) skip();

    const { error: orderErr } = await anonClient.from("orders").insert({
      reference: "KMR-HACK-0001",
      contact_name: "Attacker",
      contact_phone: "0000000000",
      contact_email: "attacker@example.com",
      shipping_address: {},
      shipping_method: "same_state",
      subtotal: 100,
      shipping_cost: 0,
      total: 100,
    } as any);

    expect(orderErr).not.toBeNull();

    const { error: itemErr } = await anonClient.from("order_items").insert({
      order_id: "00000000-0000-0000-0000-000000000000",
      product_name: "Hacked Item",
      variant_label: "M / Black",
      quantity: 1,
      unit_price_at_purchase: 1,
    } as any);

    expect(itemErr).not.toBeNull();
  });

  it("denies direct create_checkout_order call with anon key (service_role only)", async ({
    skip,
  }) => {
    if (!supabaseAvailable) skip();

    const { error } = await anonClient.rpc("create_checkout_order" as any, {
      p_user_id: null,
      p_channel: "email",
      p_contact_name: "Anon User",
      p_contact_phone: "1234567890",
      p_contact_email: "anon@example.com",
      p_shipping_method: "same_state",
      p_customer_note: null,
      p_shipping_address: sameStateAddress,
      p_items: [{ slug: "lune-silk-shirt", size: "M", color: "Ivory", quantity: 1 }],
      p_request_key: "0123456789abcdef0123456789abcdef",
    });

    expect(error).not.toBeNull();
  });

  it("derives total from database base_price regardless of any client values (Price integrity)", async ({
    skip,
  }) => {
    if (!supabaseAvailable || !shippingConfiguration) skip();

    const requestKey = `test-price-integrity-${Date.now()}`;
    await adminClient.rpc("checkout_rate_limit_touch" as any, { p_request_key: requestKey });

    const { data, error } = await adminClient.rpc("create_checkout_order" as any, {
      p_user_id: null,
      p_channel: "email",
      p_contact_name: "Test Customer",
      p_contact_phone: "1234567890",
      p_contact_email: "test@example.com",
      p_shipping_method: "same_state",
      p_customer_note: null,
      p_shipping_address: sameStateAddress,
      p_items: [{ slug: "lune-silk-shirt", size: "M", color: "Ivory", quantity: 1, fake_price: 1 }],
      p_request_key: requestKey,
    });

    expect(error).toBeNull();
    const result = Array.isArray(data) ? data[0] : data;
    expect(Number(result.subtotal)).toBe(148000);
    expect(Number(result.shipping_cost)).toBe(shippingConfiguration.same_state_fee);
    expect(Number(result.total)).toBe(148000 + shippingConfiguration.same_state_fee);
  });

  it("applies the configured same-state and interstate delivery fees", async ({ skip }) => {
    if (!supabaseAvailable || !shippingConfiguration) skip();

    const testSlug = `test-shipping-${Date.now()}`;
    const { error: insertError } = await adminClient.from("products").insert({
      slug: testSlug,
      name: "Shipping Test Piece",
      category_slug: "shirting",
      base_price: 1000,
      status: "active",
      sizes: ["M"],
      colors: ["Black"],
      stock: 2,
    });
    expect(insertError).toBeNull();

    try {
      const destinations = [
        {
          method: "same_state",
          state: shippingConfiguration.dispatch_state,
          fee: shippingConfiguration.same_state_fee,
        },
        {
          method: "interstate_waybill",
          state: `${shippingConfiguration.dispatch_state} Test Destination`,
          fee: shippingConfiguration.interstate_fee,
        },
      ];

      for (const destination of destinations) {
        const requestKey = `test-shipping-${Date.now()}-${destination.method}`;
        const { data, error } = await adminClient.rpc("create_checkout_order" as any, {
          p_user_id: null,
          p_channel: "email",
          p_contact_name: "Shipping Test",
          p_contact_phone: "1234567890",
          p_contact_email: "shipping@example.com",
          p_shipping_method: destination.method,
          p_customer_note: null,
          p_shipping_address: {
            line1: "Street",
            city: "Test City",
            state: destination.state,
            country: "Nigeria",
          },
          p_items: [{ slug: testSlug, size: "M", color: "Black", quantity: 1 }],
          p_request_key: requestKey,
        });

        expect(error).toBeNull();
        const result = Array.isArray(data) ? data[0] : data;
        expect(Number(result.shipping_cost)).toBe(destination.fee);
        expect(Number(result.total)).toBe(1000 + destination.fee);
      }

      const { error: wrongMethodError } = await adminClient.rpc("create_checkout_order" as any, {
        p_user_id: null,
        p_channel: "email",
        p_contact_name: "Shipping Test",
        p_contact_phone: "1234567890",
        p_contact_email: "shipping@example.com",
        p_shipping_method: "same_state",
        p_customer_note: null,
        p_shipping_address: {
          line1: "Street",
          city: "Test City",
          state: `${shippingConfiguration.dispatch_state} Test Destination`,
          country: "Nigeria",
        },
        p_items: [{ slug: testSlug, size: "M", color: "Black", quantity: 1 }],
        p_request_key: `test-shipping-mismatch-${Date.now()}`,
      });
      expect(wrongMethodError).not.toBeNull();
      expect(wrongMethodError?.message).toContain("does not match");
    } finally {
      await adminClient.from("products").delete().eq("slug", testSlug);
    }
  });

  it("rejects invalid size or color variants", async ({ skip }) => {
    if (!supabaseAvailable || !shippingConfiguration) skip();

    const requestKey = `test-variant-val-${Date.now()}`;
    await adminClient.rpc("checkout_rate_limit_touch" as any, { p_request_key: requestKey });

    const { error } = await adminClient.rpc("create_checkout_order" as any, {
      p_user_id: null,
      p_channel: "email",
      p_contact_name: "Test Customer",
      p_contact_phone: "1234567890",
      p_contact_email: "test@example.com",
      p_shipping_method: "same_state",
      p_customer_note: null,
      p_shipping_address: sameStateAddress,
      p_items: [{ slug: "lune-silk-shirt", size: "3XL", color: "Ivory", quantity: 1 }],
      p_request_key: requestKey,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("size");
  });

  it("prevents oversell under concurrency and keeps stock non-negative", async ({ skip }) => {
    if (!supabaseAvailable || !shippingConfiguration) skip();

    // Create temporary low-stock product
    const testSlug = `test-oversell-${Date.now()}`;
    await adminClient.from("products").insert({
      slug: testSlug,
      name: "Oversell Test Piece",
      category_slug: "shirting",
      base_price: 100000,
      status: "active",
      sizes: ["M"],
      colors: ["Black"],
      stock: 1,
    });

    const attempts = Array.from({ length: 5 }).map((_, i) => async () => {
      const reqKey = `oversell-req-${Date.now()}-${i}`;
      await adminClient.rpc("checkout_rate_limit_touch" as any, { p_request_key: reqKey });
      return adminClient.rpc("create_checkout_order" as any, {
        p_user_id: null,
        p_channel: "email",
        p_contact_name: `Buyer ${i}`,
        p_contact_phone: "1234567890",
        p_contact_email: `buyer${i}@example.com`,
        p_shipping_method: "same_state",
        p_customer_note: null,
        p_shipping_address: sameStateAddress,
        p_items: [{ slug: testSlug, size: "M", color: "Black", quantity: 1 }],
        p_request_key: reqKey,
      });
    });

    const results = await Promise.all(attempts.map((fn) => fn()));
    const succeeded = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(4);

    const { data: updatedProduct } = await adminClient
      .from("products")
      .select("stock")
      .eq("slug", testSlug)
      .single();

    expect(updatedProduct?.stock).toBe(0);
  });

  it("enforces rate limits (6th attempt in window rejected)", async ({ skip }) => {
    if (!supabaseAvailable) skip();

    const requestKey = `test-rate-limit-${Date.now()}`;

    for (let i = 1; i <= 5; i++) {
      const { error } = await adminClient.rpc("checkout_rate_limit_touch" as any, {
        p_request_key: requestKey,
      });
      expect(error).toBeNull();
    }

    const { error: sixthErr } = await adminClient.rpc("checkout_rate_limit_touch" as any, {
      p_request_key: requestKey,
    });
    expect(sixthErr).not.toBeNull();
    expect(sixthErr?.message).toContain("Too many order attempts");
  });

  it("rate limit counter persists even after a failed order attempt", async ({ skip }) => {
    if (!supabaseAvailable) skip();

    const requestKey = `test-rate-limit-rollback-${Date.now()}`;

    // 1st touch succeeds
    await adminClient.rpc("checkout_rate_limit_touch" as any, { p_request_key: requestKey });

    // Try invalid order that fails
    await adminClient.rpc("create_checkout_order" as any, {
      p_user_id: null,
      p_channel: "email",
      p_contact_name: "Test Customer",
      p_contact_phone: "1234567890",
      p_contact_email: "test@example.com",
      p_shipping_method: "same_state",
      p_customer_note: null,
      p_shipping_address: sameStateAddress,
      p_items: [{ slug: "non-existent-item-slug", size: "M", color: "Ivory", quantity: 1 }],
      p_request_key: requestKey,
    });

    // Touch 4 more times (total 5)
    for (let i = 2; i <= 5; i++) {
      await adminClient.rpc("checkout_rate_limit_touch" as any, { p_request_key: requestKey });
    }

    // 6th touch fails due to rate limit
    const { error } = await adminClient.rpc("checkout_rate_limit_touch" as any, {
      p_request_key: requestKey,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain("Too many order attempts");
  });
});
