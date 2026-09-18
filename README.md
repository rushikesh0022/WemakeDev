# Zaply v1

A local-first quick-commerce MVP with a single hybrid search, optional AI basket planning, editable suggestions, a synchronized cart, provider-ready checkout, and post-order UPI splitting.

This repository contains the first complete Zaply MVP release (`v1.0.0`).

## Run the web app

```bash
pnpm install
pnpm dev
```

Before starting, copy the environment template and add your server-side API key:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Open [http://localhost:3000](http://localhost:3000). The top search returns normal catalog results first. Choose **Ask Zaply AI** below autocomplete or below the results when the same text describes a recipe, occasion, or goal. The API key is never sent to the browser.

The delivery header accepts a saved account address, a manually entered neighbourhood, or browser location. GPS is requested only after the customer chooses **Use my current location**; the server converts the coordinates to a suburb-level label and the browser stores that label for future visits. The local MVP uses OpenStreetMap Nominatim for this lookup. Set `GEOCODING_REVERSE_URL` to a managed or self-hosted endpoint for production traffic.

Customer accounts use salted `scrypt` password hashes and signed HTTP-only session cookies. Set a long random `AUTH_SECRET` before deployment. To grant the separate control-room role, list approved email addresses in `ADMIN_EMAILS` as a comma-separated value before those users register. Local account records are written to the ignored `apps/web/.zaply-data` directory; replace this adapter with Cognito or a managed database in production.

## Payment and friend splitting

The local checkout uses `PAYMENT_PROVIDER=fake`. In development, its selector can reproduce approved, pending, declined, and timed-out payment states. An order becomes paid only after the server-side provider adapter approves it.

After a paid order, the owner can create a seven-day private split from **Account → Orders**. Friends use the private link without creating an account, claim whole item quantities, and pay the owner directly using the generated UPI intent or QR. The owner confirms receipt. Zaply never handles the reimbursement, requests a UPI PIN, or claims to credit an Amazon Pay wallet. The local records live in the ignored `apps/web/.zaply-data` directory.

`AmazonPayProvider` and the IPN route are deliberately unconfigured boundaries. Do not set `PAYMENT_PROVIDER=amazon_pay` until merchant onboarding, sandbox credentials, callback safelisting, signed-IPN verification, and status reconciliation are implemented.

To use Ollama instead, set `LLM_PROVIDER=ollama` in `apps/web/.env.local` and run the configured local model.

## Recommendation pipeline

1. Weighted lexical retrieval, popularity, availability and recent-cart affinity produce instant normal search results.
2. The customer can explicitly promote the same query to the model, which converts it into free-form requirements and catalog-aligned retrieval queries. There is no mission lookup table or intent/importance enum.
3. Local retrieval finds real in-stock candidates for each need.
4. AI candidates are ranked by semantic overlap (62%), public evidence (25%), and affinity to local history (13%).
5. Hard filters remove unavailable or excluded products, and a budget pass chooses affordable alternatives.
6. The UI shows an editable suggested basket. Only selected items enter the cart.

See [docs/architecture.md](docs/architecture.md) for the local and AWS target designs.

## Demo requests

- `paneer tikka for four under ₹700`
- `movie night for two under ₹500, nothing spicy`
- `healthy breakfast under ₹300`
- `chips`

The catalog includes one iconic image from each of the 81 classes in GroceryStoreDataset. Prices, ratings, stock, delivery times, and orders are fictional demonstration data.
