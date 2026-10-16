import DigitalLibrary from "@/components/account/DigitalLibrary";
export const metadata = { title: "Digital Resource | Awaken With Me" };
export default async function DigitalResourcePage({ params }) {
  const { entitlementId } = await params;
  return <DigitalLibrary key={entitlementId} entitlementId={entitlementId} />;
}
