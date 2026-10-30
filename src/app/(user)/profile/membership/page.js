
import MyMembership from "@/components/user/membership/MyMembership";

export const metadata = {
  title: "My Membership | AwakenWithMeheck",
};

export default async function MembershipPage({
  searchParams,
}) {
  const params = await searchParams;

  const rawPlanId = params?.planId;

  const planId =
    typeof rawPlanId === "string"
      ? rawPlanId
      : "";

  return <MyMembership planId={planId} />;
}
