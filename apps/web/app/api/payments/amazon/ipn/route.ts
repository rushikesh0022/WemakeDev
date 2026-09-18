import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Amazon Pay IPN processing is disabled until sandbox credentials and Amazon SNS signature verification are configured." }, { status: 501 });
}
