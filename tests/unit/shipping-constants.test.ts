import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { storeConfig } from "@/lib/store-config";

describe("shipping constants drift guard", () => {
  it("matches client shipping costs with server RPC values in migration SQL", () => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20260813000700_secure_checkout.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    // Extract RPC values from the CASE block in SQL
    const standardMatch = sql.match(/when 'standard' then (\d+)/);
    const expressMatch = sql.match(/when 'express' then (\d+)/);
    const pickupMatch = sql.match(/when 'pickup' then (\d+)/);

    expect(standardMatch).not.toBeNull();
    expect(expressMatch).not.toBeNull();
    expect(pickupMatch).not.toBeNull();

    const rpcStandardCost = Number(standardMatch![1]);
    const rpcExpressCost = Number(expressMatch![1]);
    const rpcPickupCost = Number(pickupMatch![1]);

    const clientStandard = storeConfig.shipping.find((s) => s.id === "standard")?.cost;
    const clientExpress = storeConfig.shipping.find((s) => s.id === "express")?.cost;
    const clientPickup = storeConfig.shipping.find((s) => s.id === "pickup")?.cost;

    expect(clientStandard).toBe(rpcStandardCost);
    expect(clientExpress).toBe(rpcExpressCost);
    expect(clientPickup).toBe(rpcPickupCost);
  });
});
