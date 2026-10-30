import LessonSpace from "@/components/user/learning/LessonSpace";

export const metadata = { title: "Course Lesson | AwakenWithMeheck" };

export default async function MyLessonPage({ params }) {
  const { courseId, lessonId } = await params;
  return <LessonSpace key={`${courseId}-${lessonId}`} courseId={courseId} lessonId={lessonId} />;
}
