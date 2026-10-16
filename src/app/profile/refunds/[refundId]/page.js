import CommerceCenter from "@/components/commerce/CommerceCenter";
export const metadata = { title: "Refund Details | Awaken With Me" };
export default async function RefundPage({ params }) { const { refundId } = await params; return <CommerceCenter section="refunds" id={refundId} />; }
