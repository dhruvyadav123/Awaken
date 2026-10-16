import PublicCatalogPage from "@/components/common/PublicCatalogPage";
import { allPublicItems } from "@/lib/public-api";

export const metadata = { title: "Workshops | Awaken With Me" };
export default async function WorkshopsPage() {
  const result = await allPublicItems("classes");
  const workshops = Array.isArray(result.data) ? result.data.filter(item => item.kind === "WORKSHOP") : [];
  return <PublicCatalogPage eyebrow="Workshops" title="Current workshops" items={workshops} basePath="/classes" error={result.error} emptyMessage="No workshops are published right now." />;
}
