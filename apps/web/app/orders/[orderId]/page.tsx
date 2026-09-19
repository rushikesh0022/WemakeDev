import { notFound, redirect } from "next/navigation";
import { OrderTrackingExperience } from "@/components/OrderTrackingExperience";
import { currentUser, getOrder } from "@/lib/auth";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/account");
  const order = await getOrder(user.id, (await params).orderId);
  if (!order) notFound();
  if (!user.address) redirect("/account");
  return <OrderTrackingExperience order={order} address={user.address} allowFulfillmentSimulation={process.env.NODE_ENV !== "production"} />;
}
