import MySessions from "@/components/sessions/MySessions";
export const metadata = { title: "Session Booking | Awaken With Me" };
export default async function BookingPage({ params }) { const { bookingId } = await params; return <MySessions bookingId={bookingId} />; }
