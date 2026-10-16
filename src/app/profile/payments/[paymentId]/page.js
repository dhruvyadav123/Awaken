import CommerceCenter from "@/components/commerce/CommerceCenter";
export const metadata = { title: "Payment Details | Awaken With Me" };
export default async function PaymentPage({ params }) { const { paymentId } = await params; return <CommerceCenter section="payments" id={paymentId} />; }
