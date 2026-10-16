import MyMembership from "@/components/membership/MyMembership";
export const metadata = { title: "Membership Details | Awaken With Me" };
export default async function MembershipDetailPage({ params }) { const { membershipId } = await params; return <MyMembership membershipId={membershipId} />; }
