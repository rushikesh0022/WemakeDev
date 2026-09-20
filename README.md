# Zaply

A mobile-first quick-commerce application with hybrid search, optional basket planning, live catalog data, provider-ready checkout, and shared Amazon Pay group baskets.

Zaply supports both individual checkout and a pre-checkout group flow where friends choose products and contribute before one delivery order is placed.

## Run the web app

```bash
pnpm install
pnpm dev
```

Before starting, copy the environment template and configure a local or cloud model provider:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Open [http://localhost:3000](http://localhost:3000). The top search returns normal catalog results first. Choose **Plan this basket** below autocomplete or below the results when the same text describes a recipe, occasion, or goal. Provider credentials are never sent to the browser. The AWS deployment supports Amazon Nova Micro through Bedrock, but Bedrock inference is left disabled in zero-cost mode because it is billed per token.

For local checkout, sign in with `demo@nesto.app` and `NestoDemo123!`. This development-only account remains available even when an older local data file is present and is never seeded in production.

The delivery header accepts a saved account address, a manually entered neighbourhood, or browser location. GPS is requested only after the customer chooses **Use my current location**; the server converts the coordinates to a suburb-level label and the browser stores that label for future visits. The local MVP uses OpenStreetMap Nominatim for this lookup. Set `GEOCODING_REVERSE_URL` to a managed or self-hosted endpoint for production traffic.

Customer accounts use salted `scrypt` password hashes and signed HTTP-only session cookies. Set a long random `AUTH_SECRET` before deployment. To grant the separate control-room role, list approved email addresses in `ADMIN_EMAILS` as a comma-separated value before those users register. Local account records are written to the ignored `apps/web/.nesto-data` directory; production uses the DynamoDB adapter.

## Amazon Pay group baskets

The local checkout uses `PAYMENT_PROVIDER=fake`. In development, its selector can reproduce approved, pending, declined, and timed-out payment states. An order becomes paid only after the server-side provider adapter approves it.

From the cart, the owner can choose **Share basket with friends**. Zaply creates a seven-day private basket. Friends open the link without an account, claim whole product quantities, link Amazon Pay, and authorize a merchant charge for their portion. Once all friend contributions are approved, the owner links Amazon Pay, pays the remaining portion, and places one delivery order.

The owner can then open the mobile-first tracking screen, which shows the confirmed, packing, on-the-way, and delivered stages, ETA, delivery address, and purchased line items. Development builds include a local fulfilment simulator for testing each stage; production expects these transitions from the order and delivery services.

The local adapter simulates Amazon account linking and merchant charges. It does not transfer money between personal wallets. With `PAYMENT_PROVIDER=amazon_pay`, the group flow now starts Amazon's web SDK consent, validates a one-time state value, exchanges the returned authorization code on the server, encrypts the access and refresh tokens, and links the resulting authorization reference to only that owner or participant. Amazon's documented merchant APIs support customer account linking, instrument lookup, merchant charges, status checks, and refunds; they do not expose a general consumer-wallet deposit API. A real sandbox connection still requires merchant onboarding, KYC, credentials, and safelisted callback/IPN URLs.

The OAuth callback is `/api/payments/amazon/callback`. Configure its full public URL as `AMAZON_PAY_REDIRECT_URI`, safelist it with Amazon, and provide a base64-encoded 32-byte `AMAZON_PAY_TOKEN_ENCRYPTION_KEY`. `AmazonPayProvider` and the IPN route remain guarded boundaries until the sandbox Charge, Instruments, Status, and signed-IPN credentials are available. Do not enable real charges before those checks pass.

To use Ollama instead, set `LLM_PROVIDER=ollama` in `apps/web/.env.local` and run the configured local model.

## Recommendation pipeline

1. Weighted lexical retrieval, popularity, availability and recent-cart affinity produce instant normal search results.
2. The customer can explicitly promote the same query to the model, which converts it into free-form requirements and catalog-aligned retrieval queries. There is no mission lookup table or intent/importance enum.
3. Local retrieval finds real in-stock candidates for each need.
4. AI candidates are ranked by semantic overlap (62%), public evidence (25%), and affinity to local history (13%).
5. Hard filters remove unavailable or excluded products, and a budget pass chooses affordable alternatives.
6. The UI shows an editable suggested basket. Only selected items enter the cart.

See [docs/architecture.md](docs/architecture.md) for the local and AWS target designs.

## AWS test connection

The AWS console/MCP connection lets Codex inspect and manage the AWS account, but it is not an Amazon Pay application credential. The deployable test foundation lives in `infra/aws/pico-foundation.yaml`; deployment instructions and cleanup commands are in `infra/aws/README.md`. It creates only serverless test resources and deliberately excludes Bedrock provisioned capacity, OpenSearch, RDS, NAT gateways, and always-running compute.

After deployment, add the CloudFormation outputs to `apps/web/.env.local` and visit `/api/aws/status`. The response is `configured: true` only when every required AWS connection value is present, and `health.reachable: true` only when the deployed API responds successfully.

Set `DATA_BACKEND=dynamodb` to persist accounts, orders, group baskets and payment transaction records in the deployed table. Set `AUTH_PROVIDER=cognito` to use Cognito registration, email confirmation and password authentication. Local development continues using the file-backed store and local password verifier unless those switches are enabled.

## Demo requests

- `paneer tikka for four under ₹700`
- `movie night for two under ₹500, nothing spicy`
- `healthy breakfast under ₹300`
- `chips`

The catalog includes one iconic image from each of the 81 classes in GroceryStoreDataset. Prices, ratings, stock, delivery times, and orders are fictional demonstration data.
