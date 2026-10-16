"use client";
import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { dataOf, lessonsOf, titleOf } from "@/lib/learning-data";
import { courseProgress, courseLearningHref, completedLesson } from "@/lib/course-learning";
import { MembershipDiscount } from "@/components/membership/MyMembership";
import { CourseReviewForm } from "./Reviews";

export default function CourseSpace({ courseId }) {
  const pathname = usePathname();
  const base = pathname.startsWith("/dashboard/") ? "/dashboard/user/courses" : "/profile/courses";
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const enrollmentLock = useRef(false);
  const path = `me/courses/${encodeURIComponent(courseId)}`;

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError(""); setStatus(null); setProgressError(""); setCourse(null); setProgress(null);
    try {
      const value = dataOf(await accountFetch(path));
      if (request !== sequence.current) return;
      const record = value?.course ? { ...value.course, ...value, lessons: value.lessons || value.course.lessons, enrollmentStatus: value.enrollmentStatus || value.enrollment?.status } : value;
      setCourse(record);
      if (record.hasAccess !== false) {
        try {
          const response = await accountFetch(`${path}/progress`);
          if (request === sequence.current) setProgress(dataOf(response));
        } catch (caught) { if (request === sequence.current) setProgressError(caught.message); }
      }
    } catch (caught) {
      if (request === sequence.current) { setError(caught.message); setStatus(caught.status); }
    } finally { if (request === sequence.current) setLoading(false); }
  }, [path]);

  useEffect(() => {
    const counter = sequence;
    const timer = setTimeout(() => void load(), 0);
    return () => { clearTimeout(timer); counter.current++; };
  }, [load]);

  async function enroll() {
    if (enrollmentLock.current) return;
    enrollmentLock.current = true;
    setWorking(true); setNotice("");
    try {
      await accountFetch(`${path}/enroll`, { method: "POST", body: {} });
      setNotice("Enrollment confirmed. Your course is ready below.");
      await load();
    } catch (caught) { setError(caught.message); setStatus(caught.status); }
    finally { enrollmentLock.current = false; setWorking(false); }
  }

  const canAccess = Boolean(course) && course.hasAccess !== false;
  const enrolled = course?.enrollmentStatus || course?.enrollment?.status;
  const lessons = lessonsOf(course);
  const values = courseProgress(progress || course);
  const resume = courseLearningHref({ ...course, courseId }, base);
  const firstLesson = lessons[0]?.id || lessons[0]?.lessonId;
  const start = resume && resume !== `${base}/${encodeURIComponent(courseId)}` ? resume : firstLesson ? `${base}/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(firstLesson)}` : "";

  return <section className="bg-[#f7f8f3] px-5 py-10 text-[#29473c] sm:px-8"><div className="mx-auto max-w-4xl">
    <Link prefetch={false} href={base} className="text-sm text-[#315a48] hover:underline">&larr; My courses</Link>
    <h1 className="mt-7 break-words font-[Georgia,serif] text-4xl">{titleOf(course, "Course learning space")}</h1>
    {loading && <p className="mt-6" role="status">Loading your course...</p>}
    {error && <div className="mt-6 text-sm text-[#8a4c3c]" role="alert"><p>{error}</p><button type="button" onClick={load} className="mt-3 underline">Try again</button>{status === 401 && <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className="ml-4 underline">Sign in</Link>}</div>}
    {notice && <p className="mt-6 text-sm text-[#315a48]" role="status">{notice}</p>}
    {!loading && !course && [403, 404].includes(status) && <MembershipDiscount courseId={courseId} />}
    {!loading && !course && [403, 404].includes(status) && <div className="mt-6"><p className="mb-4 text-sm leading-7 text-[#647368]">If you have not enrolled, request access to this course. Any payment or membership requirements will be checked by the service.</p><button type="button" disabled={working} onClick={enroll} className="bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Enrolling..." : "Enroll in this course"}</button></div>}
    {!loading && course && <div className="mt-7 space-y-8"><RecordMedia record={course} imagesOnly /><RecordDetails record={course} exclude={["lessons", "sections", "modules", "course"]} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#647368]">{course.facilitatorName && <p>With {course.facilitatorName}</p>}{enrolled && <p>Status: {String(enrolled).replaceAll("_", " ")}</p>}{course.expiresAt && <p>Access until {new Date(course.expiresAt).toLocaleDateString("en-IN")}</p>}</div>
      {!canAccess && <p role="status" className="text-sm leading-7 text-[#8a4c3c]">Your course access is currently unavailable. Lessons will open when the service restores access. <Link href="/contact" className="underline">Contact support</Link></p>}
      {(course.shortDescription || course.description) && <p className="text-sm leading-7 text-[#647368]">{course.shortDescription || course.description}</p>}
      <section className="border-y border-[#dfe7dd] py-6"><h2 className="font-[Georgia,serif] text-2xl">Your progress</h2>{values.completed != null && values.total != null && <p className="mt-3 text-sm text-[#647368]">{values.completed} of {values.total} lessons completed</p>}{values.percent != null && <><progress value={values.percent} max={100} aria-label="Course completion" className="mt-3 h-2 w-full accent-[#315a48]" /><p className="mt-2 text-sm text-[#647368]">{values.percent}% complete</p></>}{progressError && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">Lesson progress could not be refreshed. {progressError} <button type="button" onClick={load} className="underline">Retry</button></p>}
        {canAccess && start && <Link prefetch={false} href={start} className="mt-5 inline-block bg-[#315a48] px-5 py-3 text-sm font-semibold text-white">{course.completed || enrolled === "COMPLETED" ? "Review lessons" : course.lastLessonId ? "Continue learning" : "Start learning"}</Link>}
      </section>
      <section><h2 className="font-[Georgia,serif] text-2xl">Course lessons</h2>{lessons.length ? <ol className="mt-4 divide-y divide-[#dfe7dd]">{lessons.map((lesson) => {
        const id = lesson.id || lesson.lessonId;
        const complete = completedLesson(progress, id);
        return <li key={id || lesson.title} className="flex min-w-0 flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><p className="text-xs text-[#647368]">{lesson.sectionTitle || "Course lesson"}{complete ? " · Completed" : ""}</p><h3 className="mt-2 break-words font-medium">{titleOf(lesson, "Lesson")}</h3><p className="mt-2 text-xs text-[#647368]">{lesson.contentType || "Lesson"}{lesson.duration > 0 ? ` · Duration: ${lesson.duration}` : ""}</p></div>{id && canAccess && <Link prefetch={false} href={`${base}/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(id)}`} className="text-sm font-semibold text-[#315a48] hover:underline">{complete ? "Review lesson" : "Open lesson"} &rarr;</Link>}</li>;
      })}</ol> : <p className="mt-4 text-sm text-[#647368]">No lessons have been published in this course yet.</p>}</section>
      {course.certificateEnabled === false && <p className="text-sm text-[#647368]">This course does not offer a certificate.</p>}
      {course.certificateAvailable && course.certificateId && <Link prefetch={false} href={`/profile/certificates/${encodeURIComponent(course.certificateId)}`} className="inline-block text-sm font-semibold text-[#315a48] underline">View your certificate</Link>}
      {canAccess && <CourseReviewForm courseId={courseId} />}
    </div>}
  </div></section>;
}
