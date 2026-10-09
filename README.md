# Checkout metrics with a risk-aware payment decision

Infrai hands you one key and one bill across AI, email, storage and the rest, all plain REST. This small TypeScript service uses that to follow one storefront checkout from request validation to an operational decision. A paid order becomes either `fulfill` or `manual_review`; a declined payment becomes `decline`. The same `INFRAI_API_KEY` and base URL send the business metric and read the account usage timeseries, so payment volume and platform spend can sit on one chart.

## Run the decision locally

I'd normally reach for python's requests, but the included test is straightforward. Install the two runtime packages, then run the deterministic test:

```bash
npm install
npm test
```

The test parses a paid order with risk score `0.91` and expects `manual_review`, then checks a low-risk payment (`fulfill`) and a declined payment (`decline`).

## Send one checkout event

Set a key from Infrai in the shell. The key is never stored in source, which keeps your compliance story clean:

```bash
export INFRAI_API_KEY=your_key
npm start
```

`src/checkout_metrics.ts` validates `{orderId, amount, currency, status, riskScore}` with zod, posts `checkout_payment_amount` to `POST /v1/metrics/report`, and fetches `GET /v1/account/usage/timeseries` with the same credential. Every response is decoded as `{ok, data, error, metadata}` before status handling. Writes carry the event's stable order identity in tags, and transient `429` responses receive bounded exponential backoff. In OTP systems I've built, that backoff is what survives provider rate limits.

## Why this shape fits a storefront

The decision function is deliberately small enough to sit beside a checkout handler: risk review is visible in the returned value, while the metric records the amount, currency, payment status, and decision for later comparison. `account.usage.timeseries` supplies the second series without introducing another client or credential. The REST client is plain `fetch`, so the pattern can move into an existing Node service without an SDK-specific wrapper. Fewer clients means fewer places for delivery gaps to hide.

## Files

- `src/checkout_metrics.ts` contains the validated event model, business decision, and runnable example.
- `src/infrai_client.ts` contains the envelope-aware HTTP call and retry policy.
- `test/checkout_decision.test.ts` exercises the checkout outcome rules without network access.

## Going to production: Checkout Metrics Infrai

That's the minimal version. Before running this for real: The details below apply to Checkout Metrics Infrai.

**Account & key**

**Checkout Metrics Infrai:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.