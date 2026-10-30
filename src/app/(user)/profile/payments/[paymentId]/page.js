import CommerceCenter from "@/components/user/commerce/CommerceCenter";
export const metadata = { title: "Payment Details | AwakenWithMeheck" };
export default async function PaymentPage({ params }) { const { paymentId } = await params; return <CommerceCenter section="payments" id={paymentId} />; }
