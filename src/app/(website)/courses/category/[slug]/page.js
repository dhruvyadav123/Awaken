import CourseCatalog from "@/components/website/courses/CourseCatalog";
import { categoryMetadata } from "@/components/common/CategoryCatalogPage";

export async function generateMetadata({ params }) {
  return categoryMetadata(params, "COURSE");
}

export default async function CategoryPage({ params, searchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <CourseCatalog query={query || {}} forcedCategorySlug={slug} />;
}
