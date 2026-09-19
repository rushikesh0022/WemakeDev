import { describe, expect, it } from "vitest";
import { createSnsSigningString, parseAmazonPayNotification } from "./amazon-pay-ipn";

describe("Amazon Pay IPN", () => {
  it("creates the documented SNS notification signing string", () => {
    expect(createSnsSigningString({ Type: "Notification", Message: "hello", MessageId: "m1", Timestamp: "2026-09-20T00:00:00Z", TopicArn: "arn:aws:sns:ap-south-1:1:amazon-pay", Subject: "charge" })).toBe(
      "Message\nhello\nMessageId\nm1\nSubject\ncharge\nTimestamp\n2026-09-20T00:00:00Z\nTopicArn\narn:aws:sns:ap-south-1:1:amazon-pay\nType\nNotification\n"
    );
  });

  it("maps an approved capture without exposing provider payload", () => {
    expect(parseAmazonPayNotification(JSON.stringify({ customData: "pay_123", amazonChargeId: "AZ123", status: "CaptureApproved", amount: "42.50" }))).toEqual({
      transactionId: "pay_123", providerReference: "AZ123", status: "approved", approvedAmountPaise: 4250
    });
  });
});
