import { notFound } from "next/navigation";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { facilitatorNavigation } from "@/lib/dashboard/navigation";
export const metadata = { title: "Teaching workspace | Awaken With Me" };
export default async function FacilitatorDashboard({ params }) { const { segments = [] } = await params; const section = segments[0] || "overview"; if (!facilitatorNavigation.some(([id]) => id === section)) notFound(); const detail = ["categories", "courses", "workshops", "session-types", "availability", "bookings", "products", "earnings", "payouts", "announcements"].includes(section); if (segments.length > (detail ? 2 : 1) || segments.some(value => /[/\\]/.test(value))) notFound(); return <DashboardPage section={section} segments={segments.slice(1)} />; }
