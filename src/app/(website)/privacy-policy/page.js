import CmsPublicPage from "../../../components/common/CmsPublicPage";
import { publicApi } from "../../../lib/public-api";

export async function generateMetadata() {
  const result = await publicApi("pages/privacy-policy");
  const page = result.data || {};
  return {
    title: `${page.seoTitle || page.title || "Privacy Policy"} | AwakenWithMeheck`,
    description: page.seoDescription || undefined,
  };
}

export default async function PrivacyPage() {
  const result = await publicApi("pages/privacy-policy");
  return <CmsPublicPage record={result.data || { title: "Privacy Policy", description: result.error || "This page is currently unavailable." }} />;
}
