import { describe, expect, it } from "vitest";
import { resolveOrderNotificationEmailConfig } from "@/lib/order-notifications.server";
import { buildOrderMessage, type OrderDetails } from "@/lib/order";

describe("order module", () => {
  it("formats buildOrderMessage as expected", () => {
    const details: OrderDetails = {
      fullName: "Ada Lovelace",
      phone: "+2348000000000",
      email: "ada@example.com",
      line1: "12 Marina Road",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      shippingMethod: "same_state",
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
    expect(message).toContain("Shipping (Same-state delivery)");
    expect(message).toContain("Note\nLeave at front desk");
  });

  it("resolves server-side notification emails with a clear fallback chain", () => {
    expect(
      resolveOrderNotificationEmailConfig({
        ORDER_FROM_EMAIL: "orders@kamoura.com",
        ORDER_NOTIFICATION_EMAIL: "studio@kamoura.com",
        VITE_ORDER_EMAIL: "public@kamoura.com",
      }),
    ).toEqual({
      from: "orders@kamoura.com",
      to: "studio@kamoura.com",
    });

    expect(
      resolveOrderNotificationEmailConfig({
        VITE_ORDER_EMAIL: "public@kamoura.com",
      }),
    ).toEqual({
      from: "public@kamoura.com",
      to: "public@kamoura.com",
    });
  });
});
