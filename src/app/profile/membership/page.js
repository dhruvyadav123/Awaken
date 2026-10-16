import MyMembership from "@/components/membership/MyMembership";
export const metadata = { title: "My Membership | Awaken With Me" };
export default async function MembershipPage({ searchParams }) { const query = await searchParams; return <MyMembership planId={query?.planId || ""} />; }
