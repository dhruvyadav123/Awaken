
import MyMembership from "@/components/user/membership/MyMembership";

export const metadata = {
  title: "Manage Membership | AwakenWithMeheck",
};

export default async function MembershipDetailPage({
  params,
}) {
  const { membershipId } = await params;

  return (
    <MyMembership membershipId={membershipId} />
  );
}
