import MySessions from "@/components/user/sessions/MySessions";
export const metadata = { title: "Session Booking | AwakenWithMeheck" };
export default async function BookingPage({ params }) { const { bookingId } = await params; return <MySessions bookingId={bookingId} />; }
