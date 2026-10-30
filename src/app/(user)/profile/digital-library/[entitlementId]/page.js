import DigitalLibrary from "@/components/user/profile/DigitalLibrary";
export const metadata = { title: "Digital Resource | AwakenWithMeheck" };
export default async function DigitalResourcePage({ params }) {
  const { entitlementId } = await params;
  return <DigitalLibrary key={entitlementId} entitlementId={entitlementId} />;
}
