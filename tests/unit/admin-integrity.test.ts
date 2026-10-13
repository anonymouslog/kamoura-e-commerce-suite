import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin data protections", () => {
  it("revalidates administrator access and removes authenticated cache on logout", () => {
    const adminRoute = source("src/routes/admin/route.tsx");
    const rootRoute = source("src/routes/__root.tsx");

    expect(adminRoute).toContain("fetchQuery({ ...accountQuery, staleTime: 0 })");
    expect(adminRoute).toContain("const { error } = await supabase.auth.signOut()");
    expect(adminRoute).toContain("queryClient.clear()");
    expect(adminRoute).toContain('navigate({ to: "/auth", replace: true })');
    expect(rootRoute).toContain("supabase.auth.onAuthStateChange");
    expect(rootRoute).toContain('event === "SIGNED_OUT" && protectedAdminPath');
    expect(rootRoute).toContain("if (event.persisted) void router.invalidate()");
    expect(rootRoute).toContain("queryClient.clear()");
  });

  it("loads Auth users only through an authenticated admin server function", () => {
    const adminFunctions = source("src/lib/admin.functions.ts");
    const adminRoute = source("src/routes/admin/route.tsx");
    const usersRoute = source("src/routes/admin/users.tsx");

    expect(adminFunctions).toContain("export const adminListUsers = createServerFn");
    expect(adminFunctions).toContain(".middleware([requireSupabaseAuth])");
    expect(adminFunctions).toContain("await assertAdmin(context.supabase, context.userId)");
    expect(adminFunctions).toContain("supabaseAdmin.auth.admin.listUsers");
    expect(adminRoute).toContain('account?.roles?.includes("admin")');
    expect(usersRoute).toContain("Loading registered users...");
    expect(usersRoute).toContain("Registered users could not be loaded:");
  });

  it("persists collection create and edit operations without a delete mutation", () => {
    const adminFunctions = source("src/lib/admin.functions.ts");

    expect(adminFunctions).toContain("export const adminUpsertCollection = createServerFn");
    expect(adminFunctions).toContain('.from("categories").insert(values)');
    expect(adminFunctions).toContain('.from("categories")\n        .update(values)');
    expect(adminFunctions).toContain('.eq("slug", data.original_slug)');
    expect(adminFunctions).not.toContain("adminDeleteCategory");
  });

  it("keeps shipping fees configurable and validates delivery method on the server", () => {
    const migration = source("supabase/migrations/20261013000100_collections_users_shipping.sql");

    expect(migration).toContain("public.store_shipping_config");
    expect(migration).toContain("expected_shipping_method := 'same_state'");
    expect(migration).toContain("expected_shipping_method := 'interstate_waybill'");
    expect(migration).toContain("p_shipping_method is distinct from expected_shipping_method");
    expect(migration).toContain("calculated_shipping := same_state_fee_value");
    expect(migration).toContain("calculated_shipping := interstate_fee_value");
  });
});
