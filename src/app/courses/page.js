import CourseCatalog from "@/components/courses/CourseCatalog";

export const metadata = {
  title: "Courses | Awaken With Me",
  description: "Browse courses by category, language and learning level.",
};

export default async function CoursesPage({ searchParams }) {
  const query = await searchParams;
  return <CourseCatalog query={query || {}} />;
}
