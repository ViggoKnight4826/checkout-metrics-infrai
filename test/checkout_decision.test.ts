import assert from "node:assert/strict";
import { decideCheckout, PaymentEvent } from "../src/checkout_metrics.js";

const event = PaymentEvent.parse({ orderId: "o-1", amount: 50, currency: "USD", status: "paid", riskScore: 0.91 });
assert.equal(decideCheckout(event), "manual_review");
assert.equal(decideCheckout({ ...event, riskScore: 0.2 }), "fulfill");
assert.equal(decideCheckout({ ...event, status: "declined" }), "decline");
console.log("checkout decisions: passed");
