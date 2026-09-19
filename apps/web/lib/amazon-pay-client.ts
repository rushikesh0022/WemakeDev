export type AmazonPayWebAuthorization = {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: "payments::conduct_silentpay";
};

type AmazonLoginApi = {
  setClientId(clientId: string): void;
  setAmazonDomain(domain: unknown): void;
  amazonDomain: { in: unknown };
  authorize(options: { scope: string; response_type: "code"; state: string; popup: false }, redirectUri: string): void;
};

declare global {
  interface Window {
    amazon?: { Login: AmazonLoginApi };
    onAmazonLoginReady?: () => void;
  }
}

async function loadAmazonLogin() {
  if (window.amazon?.Login) return window.amazon.Login;
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("amazon-login-sdk") as HTMLScriptElement | null;
    const timeout = window.setTimeout(() => reject(new Error("Amazon Pay took too long to load.")), 10_000);
    window.onAmazonLoginReady = () => { window.clearTimeout(timeout); resolve(); };
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Amazon Pay could not be loaded.")), { once: true });
      return;
    }
    const root = document.getElementById("amazon-root") ?? document.body.appendChild(Object.assign(document.createElement("div"), { id: "amazon-root" }));
    const script = document.createElement("script");
    script.id = "amazon-login-sdk";
    script.async = true;
    script.src = "https://assets.loginwithamazon.com/sdk/eu/login1.js";
    script.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error("Amazon Pay could not be loaded.")); }, { once: true });
    root.appendChild(script);
  });
  if (!window.amazon?.Login) throw new Error("Amazon Pay did not initialize.");
  return window.amazon.Login;
}

export async function authorizeWithAmazonPay(authorization: AmazonPayWebAuthorization) {
  const login = await loadAmazonLogin();
  login.setClientId(authorization.clientId);
  login.setAmazonDomain(login.amazonDomain.in);
  login.authorize({
    scope: authorization.scope,
    response_type: "code",
    state: authorization.state,
    popup: false
  }, authorization.redirectUri);
}
