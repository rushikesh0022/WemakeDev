import { NextResponse } from "next/server";
import { completeAmazonLink, getAmazonLinkReturnTo } from "@/lib/amazon-pay";
import { completeGroupAmazonLink } from "@/lib/group-orders";

export const dynamic = "force-dynamic";

function withResult(request: Request, returnTo: string, result: "linked" | "error") {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("amazon", result);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const returnTo = await getAmazonLinkReturnTo(state) ?? "/account";
  try {
    const completed = await completeAmazonLink(state, code);
    await completeGroupAmazonLink(completed.target, completed.authorizationId);
    return withResult(request, completed.returnTo, "linked");
  } catch {
    return withResult(request, returnTo, "error");
  }
}
