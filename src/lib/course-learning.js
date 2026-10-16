export function enrolledCourseId(record) {
  return record?.courseId || record?.course?.id || record?.course?.courseId || "";
}

export function courseProgress(record) {
  const percent = record?.progressPercent ?? record?.percentComplete ?? record?.percentage;
  return {
    percent: typeof percent === "number" && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null,
    completed: record?.completedLessons ?? record?.completedCount ?? null,
    total: record?.totalLessons ?? record?.totalCount ?? null,
  };
}

export function courseLearningHref(record, base = "/profile/courses") {
  const id = enrolledCourseId(record);
  if (!id) return "";
  const root = `${base}/${encodeURIComponent(id)}`;
  if (record.hasAccess === false || record.completed === true || record.enrollmentStatus === "COMPLETED") return root;
  const match = typeof record.continueLearningPath === "string" && record.continueLearningPath.match(/^\/api\/v1\/me\/courses\/([^/?#]+)\/lessons\/([^/?#]+)$/);
  if (match) {
    try {
      if (decodeURIComponent(match[1]) === id) return `${root}/lessons/${encodeURIComponent(decodeURIComponent(match[2]))}`;
    } catch { /* An invalid continuation path falls back to the course. */ }
  }
  return root;
}

export function completedLesson(progress, lessonId) {
  return Array.isArray(progress?.lessons) && progress.lessons.some((row) => row.lessonId === lessonId && row.status === "COMPLETED");
}

export function courseThumbnail(value) {
  if (typeof value !== "string") return "";
  const candidate = value.match(/^\[[^\]]+\]\((https?:\/\/[^\s]+)\)$/)?.[1] || value;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try { const url = new URL(candidate); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}

export async function openEnrolledCourse(request, courseId) {
  const path = `me/courses/${encodeURIComponent(courseId)}`;
  try { return await request(path); }
  catch (error) {
    if (![403, 404].includes(error.status)) throw error;
    return request(`${path}/enroll`, { method: "POST", body: {} });
  }
}
