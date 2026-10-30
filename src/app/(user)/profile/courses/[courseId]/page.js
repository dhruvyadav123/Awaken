import CourseSpace from "@/components/user/learning/CourseSpace";

export const metadata = { title: "Course Learning Space | AwakenWithMeheck" };

export default async function MyCoursePage({ params }) {
  const { courseId } = await params;
  return <CourseSpace key={courseId} courseId={courseId} />;
}
