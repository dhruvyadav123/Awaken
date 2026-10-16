import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import PublicCatalogPage from "@/components/common/PublicCatalogPage";
import { allPublicItems } from "@/lib/public-api";

export const metadata = { title: "Meditations | Awaken With Meheck", description: "Explore guided meditations and short practices." };

export default async function MeditationsPage() {
  const [result, categories] = await Promise.all([allPublicItems("meditations"), getPublicCategories()]);
  const filters = <><CategoryNavigation categories={categories.data} type="MEDITATION" />{categories.error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all meditations.</p>}</>;
  const meditations = Array.isArray(result.data) ? result.data : [];
  return <PublicCatalogPage eyebrow="Pause here" title="Guided meditations" description="Choose a practice and explore it at your own pace." filters={filters} items={meditations} basePath="/meditations" error={result.error} emptyMessage="No meditations are published right now." />;
}
