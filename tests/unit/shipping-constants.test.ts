import { describe, expect, it } from "vitest";
import { quoteShipping } from "@/lib/shipping";

describe("shipping quotes", () => {
  const configuration = {
    dispatch_state: "Lagos",
    same_state_fee: 1250,
    interstate_fee: 4800,
  };

  it("quotes same-state delivery case-insensitively using the configured fee", () => {
    expect(quoteShipping(configuration, " lagOS ")).toEqual({
      method: "same_state",
      label: "Same-state delivery",
      fee: 1250,
    });
  });

  it("quotes interstate waybill using the configured fee", () => {
    expect(quoteShipping(configuration, "Oyo")).toEqual({
      method: "interstate_waybill",
      label: "Interstate waybill",
      fee: 4800,
    });
  });

  it("does not fabricate a quote before configuration or destination are available", () => {
    expect(quoteShipping(null, "Lagos")).toBeNull();
    expect(quoteShipping(configuration, "")).toBeNull();
  });
});
