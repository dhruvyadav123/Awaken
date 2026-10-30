import PublicCatalogPage from "@/components/common/PublicCatalogPage";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import { categoriesForType, matchesCategory } from "@/lib/public-categories";
import { allPublicItems } from "@/lib/public-api";

export default async function CourseCatalog({ forcedCategorySlug } = {}) {
  const [result, categoryResult] = await Promise.all([
    allPublicItems("courses"),
    getPublicCategories(),
  ]);
  const categories = categoriesForType(categoryResult.data, "COURSE");
  const forcedCategory = forcedCategorySlug
    ? categories.find((category) => category.slug === forcedCategorySlug)
    : null;
  const items = Array.isArray(result.data)
    ? result.data.filter((item) => !forcedCategorySlug || (forcedCategory && matchesCategory(item, forcedCategory)))
    : [];
  const filters = <>
    <CategoryNavigation categories={categories} type="COURSE" />
    {categoryResult.error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">Course categories could not be loaded. You can still browse all courses.</p>}
  </>;
  return <PublicCatalogPage eyebrow="Learning" title={forcedCategory?.name || "Courses"} description={forcedCategory?.description || "Learn at your own pace with guided courses."} items={items} basePath="/courses" error={result.error} filters={filters} variant="course" emptyMessage={forcedCategorySlug ? "No courses are published in this category yet." : "No courses are available yet."} />;
}
