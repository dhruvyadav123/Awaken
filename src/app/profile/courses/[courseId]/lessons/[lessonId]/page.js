import LessonSpace from "@/components/learning/LessonSpace";

export const metadata = { title: "Course Lesson | Awaken With Me" };

export default async function MyLessonPage({ params }) {
  const { courseId, lessonId } = await params;
  return <LessonSpace key={`${courseId}-${lessonId}`} courseId={courseId} lessonId={lessonId} />;
}
