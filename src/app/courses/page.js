import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import { categoriesForType, matchesCategory } from "@/lib/public-categories";
import PublicCatalogPage from "@/components/common/PublicCatalogPage";
import { allPublicItems, publicApi } from "@/lib/public-api";

export const metadata = { title: "Courses | Awaken With Me", description: "Explore published Awaken courses and course details." };

function hasTaxonomy(item, taxonomy, keys) {
  const values = keys.flatMap((key) => {
    const value = item?.[key];
    return Array.isArray(value) ? value.flatMap((entry) => typeof entry === "object" ? [entry.id, entry.slug, entry.code] : [entry]) : value && typeof value === "object" ? [value.id, value.slug, value.code] : [value];
  }).filter(Boolean).map(String);
  return values.includes(String(taxonomy.id)) || values.includes(String(taxonomy.slug)) || values.includes(String(taxonomy.code));
}

export default async function CoursesPage({ searchParams }) {
  const query = await searchParams;
  const [coursesResult, languagesResult, levelsResult, categoriesResult, languageDetail, levelDetail] = await Promise.all([
    allPublicItems("courses"), allPublicItems("languages"), allPublicItems("levels"), getPublicCategories(),
    query?.language ? publicApi("languages/" + encodeURIComponent(query.language)) : null,
    query?.level ? publicApi("levels/" + encodeURIComponent(query.level)) : null,
  ]);
  const languages = (languagesResult.data || []).filter((item) => item?.slug && item?.name);
  const levels = (levelsResult.data || []).filter((item) => item?.slug && item?.name);
  const categories = categoriesForType(categoriesResult.data, "COURSE");
  const allCourses = Array.isArray(coursesResult.data) ? coursesResult.data : [];
  let courses = allCourses;
  const language = languageDetail?.data || languages.find((item) => item.slug === query?.language);
  const level = levelDetail?.data || levels.find((item) => item.slug === query?.level);
  const category = categories.find((item) => item.slug === query?.category);
  if (query?.category && !categoriesResult.error && !category) notFound();
  if (language) courses = courses.filter((item) => hasTaxonomy(item, language, ["languageId", "language", "languages", "languageCode"]));
  if (level) courses = courses.filter((item) => hasTaxonomy(item, level, ["levelId", "level", "levels"]));
  if (category) courses = courses.filter((item) => matchesCategory(item, category));

  const filters = <div className="space-y-4">
    <CategoryNavigation categories={categories} type="COURSE" activeSlug={category?.slug} />
    {categoriesResult.error && <p role="alert" className="text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all courses.</p>}
    {(languages.length || levels.length) > 0 && <nav aria-label="Course language and level filters" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#315a48]">
      {languages.map((item) => <Link key={item.id} prefetch={false} href={"/courses?language=" + encodeURIComponent(item.slug)} aria-current={query?.language === item.slug ? "page" : undefined} className="py-2 hover:underline aria-[current=page]:font-semibold">{item.name}</Link>)}
      {levels.map((item) => <Link key={item.id} prefetch={false} href={"/courses?level=" + encodeURIComponent(item.slug)} aria-current={query?.level === item.slug ? "page" : undefined} className="py-2 hover:underline aria-[current=page]:font-semibold">{item.name}</Link>)}
      {(query?.language || query?.level || query?.category) && <Link href="/courses" prefetch={false} className="py-2 font-semibold hover:underline">Clear filters</Link>}
    </nav>}
  </div>;
  return <PublicCatalogPage eyebrow="Guided learning" title="Courses" description="Explore self-paced courses and learning resources from Awaken." items={courses} basePath="/courses" error={coursesResult.error || (query?.category ? categoriesResult.error : null)} filters={filters} emptyMessage={category ? "No courses are published in this category yet." : "No courses are published right now. Check back as new learning becomes available."} />;
}
