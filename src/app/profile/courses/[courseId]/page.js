import CourseSpace from "@/components/learning/CourseSpace";

export const metadata = { title: "Course Learning Space | Awaken With Me" };

export default async function MyCoursePage({ params }) {
  const { courseId } = await params;
  return <CourseSpace key={courseId} courseId={courseId} />;
}
