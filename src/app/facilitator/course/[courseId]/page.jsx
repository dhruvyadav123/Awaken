import { redirect } from "next/navigation";

export default async function FacilitatorCoursePage({ params }) {
  const { courseId } = await params;
  redirect(`/dashboard/facilitator/courses/${encodeURIComponent(courseId)}`);
}
