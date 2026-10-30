import CmsPublicPage from "../../../components/common/CmsPublicPage";
import { publicApi } from "../../../lib/public-api";

export async function generateMetadata() {
  const result = await publicApi("pages/terms");
  const page = result.data || {};
  return {
    title: `${page.seoTitle || page.title || "Terms & Conditions"} | AwakenWithMeheck`,
    description: page.seoDescription || undefined,
  };
}

export default async function TermsPage() {
  const result = await publicApi("pages/terms");
  return <CmsPublicPage record={result.data || { title: "Terms & Conditions", description: result.error || "This page is currently unavailable." }} />;
}
