import CommerceCenter from "@/components/user/commerce/CommerceCenter";
export const metadata = { title: "Order Actions | AwakenWithMeheck" };
export default async function OrderPage({ params }) { const { orderId } = await params; return <CommerceCenter section="orders" id={orderId} />; }
