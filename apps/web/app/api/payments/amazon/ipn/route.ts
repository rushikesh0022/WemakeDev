import { NextResponse } from "next/server";
import { verifyAmazonPayNotification, parseAmazonPayNotification } from "@/lib/amazon-pay-ipn";
import { applyAmazonPayIpn } from "@/lib/payments";
import { applyGroupPaymentUpdate } from "@/lib/group-orders";

export async function POST(request: Request) {
  try {
    const envelope = await request.json();
    await verifyAmazonPayNotification(envelope);
    if (envelope.Type !== "Notification" || typeof envelope.Message !== "string") {
      return NextResponse.json({ accepted: true });
    }
    const payment = await applyAmazonPayIpn(parseAmazonPayNotification(envelope.Message));
    if (payment) await applyGroupPaymentUpdate(payment);
    return NextResponse.json({ accepted: true, matched: Boolean(payment) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The Amazon Pay notification was rejected." }, { status: 400 });
  }
}
