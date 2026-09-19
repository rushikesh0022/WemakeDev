import { describe, expect, it } from "vitest";
import { canonicalPairs, createAmazonPayCanonicalRequest, signAmazonPayRequest } from "./amazon-pay-signature";

describe("Amazon Pay request signing", () => {
  it("matches Amazon's published POST canonical request format", () => {
    const canonical = createAmazonPayCanonicalRequest({
      method: "POST",
      hostname: "amazonpay-sandbox.amazon.in",
      path: "/v1/payments/charge",
      headers: {
        "x-amz-client-id": "A2XMNOQAN8MC64",
        "x-amz-source": "Browser",
        "x-amz-user-ip": "52.95.75.13",
        "x-amz-user-agent": "Postman",
        "x-amz-algorithm": "AWS4-HMAC-SHA384",
        "x-amz-date": "20200906T043202Z",
        "x-amz-expires": "500"
      },
      payload: {
        accessToken: "Atza|I3M2u2aZQ",
        amount: "1.0",
        attributableProgram: "S2SPay",
        callbackUrl: "",
        chargeId: "Order001",
        currencyCode: "INR",
        intent: "Capture",
        merchantId: "A2XMNOQAN8MC64",
        paymentMetaData: "",
        referenceId: "Order001",
        selectedPaymentInstrument: "AmazonPayBalance"
      }
    });
    expect(canonical).toBe([
      "POST",
      "amazonpay-sandbox.amazon.in/v1/payments/charge",
      "",
      "x-amz-algorithm=AWS4-HMAC-SHA384&x-amz-client-id=A2XMNOQAN8MC64&x-amz-date=20200906T043202Z&x-amz-expires=500&x-amz-source=Browser&x-amz-user-agent=Postman&x-amz-user-ip=52.95.75.13",
      "accessToken=Atza%7CI3M2u2aZQ&amount=1.0&attributableProgram=S2SPay&callbackUrl=&chargeId=Order001&currencyCode=INR&intent=Capture&merchantId=A2XMNOQAN8MC64&paymentMetaData=&referenceId=Order001&selectedPaymentInstrument=AmazonPayBalance"
    ].join("\n"));
  });

  it("encodes RFC3986 pairs and emits a stable AWS4-HMAC-SHA384 authorization", () => {
    expect(canonicalPairs({ b: "two words", a: "Atza|token", skip: undefined })).toBe("a=Atza%7Ctoken&b=two%20words");
    const result = signAmazonPayRequest({
      method: "GET",
      hostname: "amazonpay-sandbox.amazon.in",
      path: "/v1/payments/charge",
      query: { merchantId: "MID", txnId: "order_1", txnIdType: "MerchantTxnId" },
      merchantId: "MID",
      accessKey: "ACCESS",
      secretKey: "SECRET",
      sourceIp: "127.0.0.1",
      sourceUserAgent: "Vitest",
      date: new Date("2026-09-20T01:02:03.000Z")
    });
    expect(result.headers.Authorization).toBe("AMZ+ACCESS:QA0ePVcNn1hyvsAUQ4GSbn8gkajaVqW_7OPUZVjhCMKV4qKjStncm6Ym80uai9C2");
    expect(result.stringToSign).toContain("20260920/eu-west-1/AmazonPay/aws4_request");
  });
});
