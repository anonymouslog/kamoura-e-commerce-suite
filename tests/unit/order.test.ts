import { describe, expect, it } from "vitest";
import { buildOrderMessage, shippingCost, type OrderDetails } from "@/lib/order";

describe("order module", () => {
  it("computes shippingCost correctly for all three methods", () => {
    expect(shippingCost("standard")).toBe(4500);
    expect(shippingCost("express")).toBe(9500);
    expect(shippingCost("pickup")).toBe(0);
  });

  it("formats buildOrderMessage as expected", () => {
    const details: OrderDetails = {
      fullName: "Ada Lovelace",
      phone: "+2348000000000",
      email: "ada@example.com",
      line1: "12 Marina Road",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      shippingMethod: "standard",
      note: "Leave at front desk",
    };

    const message = buildOrderMessage({
      reference: "KMR-260823-123456",
      details,
      items: [
        {
          name: "Lune Silk Shirt",
          size: "M",
          color: "Ivory",
          quantity: 2,
          price: 148000,
        },
      ],
      subtotal: 296000,
      shipping: 4500,
      total: 300500,
    });

    expect(message).toContain("KAMOURA — new order KMR-260823-123456");
    expect(message).toContain("• Lune Silk Shirt — M / Ivory × 2");
    expect(message).toContain("Ada Lovelace");
    expect(message).toContain("12 Marina Road");
    expect(message).toContain("Note\nLeave at front desk");
  });
});
