"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, titleOf } from "@/lib/learning-data";
import { completedLesson, courseProgress } from "@/lib/course-learning";

export default function LessonSpace({ courseId, lessonId }) {
  const pathname = usePathname();
  const base = pathname.startsWith("/dashboard/") ? "/dashboard/user/courses" : "/profile/courses";
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [savedComplete, setSavedComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const sequence = useRef(0);
  const lock = useRef(false);
  const path = `me/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
  const progressPath = `me/courses/${encodeURIComponent(courseId)}/progress`;

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setLesson(null); setProgress(null); setEnrollment(null); setSavedComplete(false); setLink(""); setExpiresAt(0); setExpired(false); setError(""); setProgressError(""); setNotice("");
    const [detail, progressResult] = await Promise.allSettled([accountFetch(path), accountFetch(progressPath)]);
    if (request !== sequence.current) return;
    if (detail.status === "fulfilled") { const value = dataOf(detail.value); setLesson(value.lesson || value); }
    else setError(detail.reason.message);
    if (progressResult.status === "fulfilled") setProgress(dataOf(progressResult.value));
    else setProgressError(progressResult.reason.message);
    setLoading(false);
  }, [path, progressPath]);

  useEffect(() => {
    const counter = sequence;
    const timer = setTimeout(() => void load(), 0);
    return () => { clearTimeout(timer); counter.current++; };
  }, [load]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => setExpired(true), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  async function access() {
    if (lock.current) return;
    lock.current = true; setWorking("access"); setError("");
    const request = sequence.current;
    try {
      const value = dataOf(await accountFetch(`${path}/access-link`, { method: "POST", body: {} }));
      const url = externalUrl(value) || externalUrl(value.accessLink);
      if (!url) throw new Error("The service did not return a valid lesson resource link.");
      if (request !== sequence.current) return;
      setLink(url); setExpired(false);
      setExpiresAt(typeof value.expiresIn === "number" && value.expiresIn > 0 ? Date.now() + value.expiresIn * 1000 : 0);
    } catch (caught) { if (request === sequence.current) setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function refreshProgress() {
    const request = sequence.current;
    setProgressError("");
    try { const result = dataOf(await accountFetch(progressPath)); if (request === sequence.current) setProgress(result); }
    catch (caught) { if (request === sequence.current) setProgressError(caught.message); }
  }

  const completed = savedComplete || completedLesson(progress, lessonId) || lesson?.progress?.status === "COMPLETED";
  async function complete() {
    if (lock.current || completed) return;
    lock.current = true; setWorking("complete"); setError(""); setNotice("");
    const request = sequence.current;
    try {
      const value = dataOf(await accountFetch(`${path}/progress`, { method: "POST", body: { status: "COMPLETED" } }));
      if (request !== sequence.current) return;
      setSavedComplete(true); setEnrollment(value); setProgress(null);
      setNotice(value.completed ? "Lesson completed. You have completed this course." : "Lesson completed. Your course progress has been updated.");
      await refreshProgress();
    } catch (caught) { if (request === sequence.current) setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function askQuestion(event) {
    event.preventDefault();
    if (lock.current || question.trim().length < 5) return;
    lock.current = true; setWorking("question"); setError(""); setNotice("");
    try {
      await accountFetch(`${path}/questions`, { method: "POST", body: { body: question.trim() } });
      setNotice("Your question was sent to the facilitator."); setQuestion("");
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  const values = courseProgress(progress || enrollment);
  const fileLesson = Boolean(lesson?.fileAccessPath) || lesson?.videoSource === "UPLOAD";
  const button = "px-5 py-3 text-sm font-semibold disabled:opacity-50";
  return <section className="bg-[#f7f8f3] px-5 py-10 text-[#29473c] sm:px-8"><article className="mx-auto max-w-4xl">
    <Link prefetch={false} href={`${base}/${encodeURIComponent(courseId)}`} className="text-sm text-[#315a48] hover:underline">&larr; Back to course</Link>
    {lesson?.sectionTitle && <p className="mt-7 text-xs text-[#647368]">{lesson.sectionTitle}</p>}
    <h1 className="mt-4 break-words font-[Georgia,serif] text-3xl sm:text-4xl">{titleOf(lesson, "Course lesson")}</h1>
    {loading && <p role="status" className="mt-6">Loading lesson...</p>}
    {error && <p role="alert" className="mt-6 text-sm text-[#8a4c3c]">{error}{!lesson && <button type="button" onClick={load} className="ml-3 underline">Try again</button>}</p>}
    {notice && <p role="status" className="mt-6 text-sm text-[#315a48]">{notice}</p>}
    {!loading && lesson && <div className="mt-7 space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#647368]"><span>{lesson.contentType}</span>{lesson.duration > 0 && <span>Duration: {lesson.duration}</span>}{completed && <span className="font-semibold text-[#315a48]">Completed</span>}</div>
      {(lesson.content || lesson.description || lesson.text) && <div className="whitespace-pre-line text-sm leading-8 text-[#647368]">{lesson.content || lesson.description || lesson.text}</div>}
      {fileLesson && <section aria-label="Lesson resource" className="space-y-4">
        <button type="button" disabled={Boolean(working)} onClick={access} className={`${button} bg-[#315a48] text-white`}>{working === "access" ? "Loading resource..." : link ? "Refresh resource access" : lesson.contentType === "VIDEO" ? "Load lesson video" : "Open lesson resource"}</button>
        {expired && <p role="status" className="text-sm text-[#647368]">Resource access has expired. Refresh access if playback stops or you need to reopen the resource.</p>}
        {link && lesson.contentType === "VIDEO" && <video key={link} src={link} controls playsInline preload="metadata" aria-label={titleOf(lesson, "Lesson video")} className="aspect-video w-full bg-black" onError={() => { setLink(""); setError("The video could not be played. Load the video again to renew access."); }}>Your browser does not support video playback.</video>}
        {link && lesson.contentType === "AUDIO" && <audio key={link} src={link} controls preload="metadata" className="w-full" onError={() => { setLink(""); setError("Audio access is unavailable. Refresh resource access and try again."); }} />}
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-[#315a48] underline">Open resource in a new tab</a>}
      </section>}
      {lesson.quizId && <Link prefetch={false} href={`/profile/quizzes/${encodeURIComponent(lesson.quizId)}`} className="inline-block text-sm text-[#315a48] underline">Open lesson quiz</Link>}
      {lesson.classId && <Link prefetch={false} href={`/profile/classes/${encodeURIComponent(lesson.classId)}`} className="inline-block text-sm text-[#315a48] underline">Open linked class</Link>}
      <div className="flex flex-wrap items-center gap-4"><button type="button" disabled={Boolean(working) || completed} onClick={complete} className={`${button} border border-[#315a48] text-[#315a48]`}>{completed ? "Lesson completed" : working === "complete" ? "Saving progress..." : "Mark lesson complete"}</button>{completed && <Link prefetch={false} href={`${base}/${encodeURIComponent(courseId)}`} className="text-sm font-semibold text-[#315a48] hover:underline">{enrollment?.completed ? "View completed course" : "Continue with course lessons"} &rarr;</Link>}</div>
      {(values.percent != null || values.total != null) && <section className="border-y border-[#dfe7dd] py-5"><h2 className="text-sm font-semibold">Course progress</h2>{values.completed != null && values.total != null && <p className="mt-2 text-sm text-[#647368]">{values.completed} of {values.total} lessons completed</p>}{values.percent != null && <><progress aria-label="Course completion" value={values.percent} max={100} className="mt-3 h-2 w-full accent-[#315a48]" /><p className="mt-2 text-sm text-[#647368]">{values.percent}% complete</p></>}</section>}
      {progressError && <p role="alert" className="text-sm text-[#8a4c3c]">Course progress could not be refreshed. {progressError} <button type="button" disabled={Boolean(working)} onClick={refreshProgress} className="underline">Retry progress</button></p>}
      <form onSubmit={askQuestion} className="border-t border-[#dfe7dd] pt-6"><h2 className="font-[Georgia,serif] text-2xl">Ask the facilitator</h2><label className="mt-4 block text-sm">Your question<textarea required minLength={5} maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-2 min-h-28 w-full border border-[#cbd8cb] bg-white p-3" /></label><div className="mt-4 flex flex-wrap items-center gap-4"><button type="submit" disabled={Boolean(working) || question.trim().length < 5} className={`${button} bg-[#315a48] text-white`}>{working === "question" ? "Sending..." : "Send question"}</button><Link href="/profile/questions" className="text-sm text-[#315a48] underline">My questions</Link></div></form>
    </div>}
  </article></section>;
}
