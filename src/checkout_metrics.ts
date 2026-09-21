import { z } from "zod";
import { infraiRequest } from "./infrai_client.js";

export const PaymentEvent = z.object({ orderId: z.string().min(1), amount: z.number().positive(), currency: z.string().length(3), status: z.enum(["paid", "declined"]), riskScore: z.number().min(0).max(1) });
export type PaymentEvent = z.infer<typeof PaymentEvent>;

export function decideCheckout(event: PaymentEvent): "fulfill" | "manual_review" | "decline" {
  if (event.status === "declined") return "decline";
  return event.riskScore >= 0.8 ? "manual_review" : "fulfill";
}

export async function reportCheckout(input: unknown) {
  const event = PaymentEvent.parse(input);
  const decision = decideCheckout(event);
  await infraiRequest("POST", "/v1/metrics/report", { name: "checkout_payment_amount", value: event.amount, type: "gauge", tags: { currency: event.currency, status: event.status, decision } });
  const usage = await infraiRequest<unknown>("GET", "/v1/account/usage/timeseries", undefined, { period: "day" });
  return { orderId: event.orderId, decision, usage };
}

if (process.argv[1]?.endsWith("checkout_metrics.ts")) {
  const sample = { orderId: "order-1042", amount: 129.5, currency: "USD", status: "paid", riskScore: 0.12 };
  reportCheckout(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
