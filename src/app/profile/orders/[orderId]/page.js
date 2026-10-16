import CommerceCenter from "@/components/commerce/CommerceCenter";
export const metadata = { title: "Order Actions | Awaken With Me" };
export default async function OrderPage({ params }) { const { orderId } = await params; return <CommerceCenter section="orders" id={orderId} />; }
