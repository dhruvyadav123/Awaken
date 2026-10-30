export function enrolledCourseId(record) {
  const id = record?.courseId || record?.course?.id || record?.course?.courseId;
  return typeof id === "object" ? id?.id || id?._id || "" : id || "";
}

export function courseProgress(record) {
  const percent = record?.progressPercent ?? record?.percentComplete ?? record?.percentage ?? record?.progress?.progressPercent ?? record?.progress?.percentComplete;
  return {
    percent: typeof percent === "number" && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null,
    completed: record?.completedLessons ?? record?.completedCount ?? record?.progress?.completedLessons ?? null,
    total: record?.totalLessons ?? record?.totalCount ?? record?.progress?.totalLessons ?? null,
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
  const rows = progress?.lessons || progress?.progress?.lessons;
  return Array.isArray(rows) && rows.some((row) => String(row.lessonId || row.id) === String(lessonId) && (row.status === "COMPLETED" || row.completed === true));
}

export function lessonLocked(lesson) {
  return lesson?.hasAccess === false || lesson?.canAccess === false || lesson?.isLocked === true || lesson?.locked === true;
}

export function normalizeLearningCourse(value) {
  const course = value?.course && typeof value.course === "object" ? value.course : {};
  return { ...course, ...value, lessons: value?.lessons || course.lessons, sections: value?.sections || course.sections, modules: value?.modules || course.modules };
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
