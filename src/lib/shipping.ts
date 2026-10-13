export type ShippingMethodId = "same_state" | "interstate_waybill";

export type ShippingConfiguration = {
  dispatch_state: string;
  same_state_fee: number;
  interstate_fee: number;
};

export type ShippingQuote = {
  method: ShippingMethodId;
  label: string;
  fee: number;
};

export function shippingMethodLabel(method: string): string {
  switch (method) {
    case "same_state":
      return "Same-state delivery";
    case "interstate_waybill":
      return "Interstate waybill";
    case "standard":
      return "Standard delivery";
    case "express":
      return "Express delivery";
    case "pickup":
      return "Pickup";
    default:
      return method;
  }
}

export function quoteShipping(
  configuration: ShippingConfiguration | null,
  destinationState: string,
): ShippingQuote | null {
  const state = destinationState.trim();
  if (!configuration || !state) return null;
  const sameState = state.toLowerCase() === configuration.dispatch_state.trim().toLowerCase();
  return sameState
    ? {
        method: "same_state",
        label: "Same-state delivery",
        fee: Number(configuration.same_state_fee),
      }
    : {
        method: "interstate_waybill",
        label: "Interstate waybill",
        fee: Number(configuration.interstate_fee),
      };
}
