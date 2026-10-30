import CommerceCenter from "@/components/user/commerce/CommerceCenter";
export const metadata = { title: "Refund Details | AwakenWithMeheck" };
export default async function RefundPage({ params }) { const { refundId } = await params; return <CommerceCenter section="refunds" id={refundId} />; }
