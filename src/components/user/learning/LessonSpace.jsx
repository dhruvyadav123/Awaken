"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, ExternalLink, LockKeyhole, MessageCircle, Play } from "lucide-react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, lessonsOf, titleOf } from "@/lib/learning-data";
import { completedLesson, courseProgress, lessonLocked, normalizeLearningCourse } from "@/lib/course-learning";
import { Curriculum, LearningBreadcrumb, LearningProgress, LearningSkeleton, LessonIcon } from "./LearningUI";

function hostedVideo(source) {
  try {
    const url = new URL(source);
    const host = url.hostname.replace(/^www\./, "");
    const youtubeId = host === "youtu.be" ? url.pathname.slice(1) : ["youtube.com", "m.youtube.com"].includes(host) ? url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1] : "";
    if (youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return "https://www.youtube-nocookie.com/embed/" + youtubeId;
    const vimeoId = host === "vimeo.com" ? url.pathname.match(/^\/(\d+)\/?$/)?.[1] : "";
    if (vimeoId) return "https://player.vimeo.com/video/" + vimeoId;
  } catch {}
  return "";
}

export default function LessonSpace({ courseId, lessonId }) {
  const pathname = usePathname();
  const router = useRouter();
  const embedded = pathname.startsWith("/dashboard/");
  const base = embedded ? "/dashboard/user/courses" : "/profile/courses";
  const courseHref = base + "/" + encodeURIComponent(courseId);
  const coursePath = "me/courses/" + encodeURIComponent(courseId);
  const path = coursePath + "/lessons/" + encodeURIComponent(lessonId);
  const seq = useRef(0);
  const lock = useRef(false);
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);
  const [savedComplete, setSavedComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [curriculumError, setCurriculumError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [tab, setTab] = useState("overview");

  const refreshProgress = useCallback(async (token = seq.current) => {
    setProgressError("");
    try { const response = await accountFetch(coursePath + "/progress"); if (token === seq.current) setProgress(dataOf(response)); }
    catch (caught) { if (token === seq.current) setProgressError(caught.message); }
  }, [coursePath]);

  const loadCurriculum = useCallback(async (token = seq.current) => {
    setCurriculumError("");
    try { const response = await accountFetch(coursePath); if (token === seq.current) setCourse(normalizeLearningCourse(dataOf(response))); }
    catch (caught) { if (token === seq.current) { setCourse(null); setCurriculumError(caught.message); } }
  }, [coursePath]);

  const load = useCallback(async () => {
    const token = ++seq.current;
    setLoading(true); setError(""); setErrorStatus(null);
    void refreshProgress(token);
    void loadCurriculum(token);
    try {
      const value = dataOf(await accountFetch(path));
      if (token === seq.current) setLesson(value.lesson || value);
    } catch (caught) {
      if (token === seq.current) { setLesson(null); setError(caught.message); setErrorStatus(caught.status); }
    } finally { if (token === seq.current) setLoading(false); }
  }, [path, refreshProgress, loadCurriculum]);

  useEffect(() => {
    const timer = setTimeout(() => { setLink(""); setExpiresAt(0); setExpired(false); setSavedComplete(false); setCompletionResult(null); setNotice(""); setQuestion(""); setTab("overview"); void load(); }, 0);
    return () => { clearTimeout(timer); seq.current++; };
  }, [load]);
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => { setExpired(true); setLink(""); }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  async function perform(name, run) {
    if (lock.current) return;
    lock.current = true; setWorking(name); setError(""); setNotice("");
    const token = seq.current;
    try { await run(token); }
    catch (caught) { if (token === seq.current) setError(caught.message || "Action failed. Please try again."); }
    finally { lock.current = false; if (token === seq.current) setWorking(""); }
  }

  async function loadResource() {
    await perform("access", async (token) => {
      const value = dataOf(await accountFetch(path + "/access-link", { method: "POST", body: {} }));
      const source = externalUrl(value) || externalUrl(value.accessLink);
      if (!source) throw new Error("The service did not provide a resource link.");
      if (token !== seq.current) return;
      setLink(source); setExpired(false);
      const lifetime = Number(value.expiresIn);
      setExpiresAt(Number.isFinite(lifetime) && lifetime > 0 ? Date.now() + lifetime * 1000 : 0);
    });
  }

  const completed = savedComplete || completedLesson(progress, lessonId) || lesson?.progress?.status === "COMPLETED";
  const kind = String(lesson?.contentType || "").toUpperCase();
  const externalMedia = [lesson?.videoUrl, lesson?.audioUrl, lesson?.documentUrl].map((value) => externalUrl(value)).find(Boolean) || "";
  const uploaded = Boolean(lesson?.fileAccessPath || lesson?.videoSource === "UPLOAD" || lesson?.videoMediaId || lesson?.audioMediaId || lesson?.documentMediaId || lesson?.mediaId);
  const fileLesson = uploaded || (["VIDEO", "AUDIO", "DOCUMENT"].includes(kind) && !externalMedia);
  const source = fileLesson ? !expired && link || "" : externalMedia;
  const embed = kind === "VIDEO" && source ? hostedVideo(source) : "";
  const mediaFailed = () => { setLink(""); setError("The resource could not be played. Refresh access and try again."); };
  const lessons = lessonsOf(course);
  const currentIndex = lessons.findIndex((row) => String(row.id || row.lessonId) === String(lessonId));
  const previous = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 ? lessons[currentIndex + 1] : null;
  const hrefFor = (row) => row && !lessonLocked(row) && (row.id || row.lessonId) ? courseHref + "/lessons/" + encodeURIComponent(row.id || row.lessonId) : "";
  const nextHref = hrefFor(next);
  const previousHref = hrefFor(previous);
  const progressRecord = progress || completionResult || course;
  const percent = courseProgress(progressRecord).percent;
  const courseCompleted = completionResult?.completed === true || percent === 100 || course?.enrollmentStatus === "COMPLETED";
  const canAccess = Boolean(lesson) && !lessonLocked(lesson) && course?.hasAccess !== false;
  const certificateId = (completionResult?.certificateAvailable || course?.certificateAvailable) && (completionResult?.certificateId || course?.certificateId);
  const courseTitle = titleOf(course, "Course overview");
  const lessonTitle = titleOf(lesson, "Lesson");
  const body = lesson?.content || lesson?.description || lesson?.text;

  async function markComplete(continueAfter = false) {
    if (completed || !canAccess) return;
    await perform("complete", async (token) => {
      const value = dataOf(await accountFetch(path + "/progress", { method: "POST", body: { status: "COMPLETED" } }));
      if (token !== seq.current) return;
      setSavedComplete(true); setCompletionResult(value);
      if (courseProgress(value).percent !== null) setProgress(value);
      setNotice(value.completed ? "Course completed. Well done!" : "Lesson marked as complete.");
      void refreshProgress(token);
      if (continueAfter && nextHref) router.push(nextHref);
    });
  }

  async function askQuestion(event) {
    event.preventDefault();
    if (question.trim().length < 5 || !canAccess) return;
    await perform("question", async (token) => {
      await accountFetch(path + "/questions", { method: "POST", body: { body: question.trim() } });
      if (token !== seq.current) return;
      setQuestion(""); setNotice("Your question was sent to the facilitator.");
    });
  }

  return <main className={"learn-shell " + (embedded ? "is-embedded" : "")}><div className="learn-container">
    <LearningBreadcrumb base={base} courseHref={courseHref} courseTitle={courseTitle} lessonTitle={lesson && lessonTitle} />
    {loading ? <LearningSkeleton lesson /> : <>
      {error && <div role="alert" className="learn-inline-alert">{error}{!lesson && <button type="button" onClick={() => void load()}>Try again</button>}{errorStatus === 401 && <Link href={"/auth/login?next=" + encodeURIComponent(pathname)}>Sign in</Link>}</div>}
      {notice && <p role="status" className="learn-notice">{notice}</p>}
      {lesson && !canAccess && <div className="learn-inline-alert" role="status"><LockKeyhole size={16} /> This lesson is currently locked. <Link href={courseHref}>Check course access</Link></div>}
      {lesson && <div className="learn-lesson-layout"><div className="learn-lesson-main">
        {canAccess && (fileLesson || externalMedia) && <>
          <section className="learn-player" aria-label="Lesson media">
            {source && kind === "VIDEO" ? embed ? <iframe src={embed} title={lessonTitle} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <video key={source} src={source} controls playsInline preload="metadata" onError={mediaFailed}>Your browser does not support video playback.</video> : source && kind === "AUDIO" ? <div className="learn-audio"><p>Audio lesson</p><audio key={source} src={source} controls preload="metadata" onError={mediaFailed} /></div> : <div className="learn-player-placeholder"><LessonIcon kind={kind} size={36} /><p>{expired ? "Your resource access expired. Renew it to continue." : kind === "DOCUMENT" ? "Open the lesson document to read at your own pace." : "Your lesson is ready. Select play to begin."}</p>{source ? <a className="learn-button" href={source} target="_blank" rel="noopener noreferrer">Open document<ExternalLink size={14} /></a> : <button type="button" className="learn-button" onClick={loadResource} disabled={Boolean(working)}><Play size={15} />{working === "access" ? "Loading…" : expired ? "Renew resource access" : kind === "VIDEO" ? "Play lesson video" : kind === "AUDIO" ? "Play lesson audio" : "Open lesson resource"}</button>}</div>}
          </section>
          {source && <div className="learn-player-tools"><a href={source} target="_blank" rel="noopener noreferrer">Open resource in new tab ↗</a>{fileLesson && <button type="button" disabled={Boolean(working)} onClick={loadResource}>Refresh access</button>}</div>}
        </>}
        <header className="learn-lesson-heading"><span className="learn-kicker">{currentIndex >= 0 ? "LESSON " + (currentIndex + 1) + " OF " + lessons.length : "YOUR LESSON"}{lesson.sectionTitle ? " · " + lesson.sectionTitle : ""}</span><h1>{lessonTitle}</h1><div className="learn-meta">{kind && <span><LessonIcon kind={kind} size={13} />{kind.toLowerCase()}</span>}{Number(lesson.durationMinutes ?? lesson.duration) > 0 && <span>{lesson.durationMinutes ?? lesson.duration} min</span>}{completed && <span className="learn-status"><CheckCircle2 size={13} />Completed</span>}</div></header>
        {canAccess && <div className="learn-complete-bar"><p>{completed ? "Lesson complete. Continue when you are ready." : "Finished this lesson? Save your progress below."}</p><button type="button" className="learn-button" onClick={() => void markComplete()} disabled={Boolean(working) || completed}><CheckCircle2 size={15} />{completed ? "Lesson completed" : working === "complete" ? "Saving…" : "Mark lesson complete"}</button></div>}
        <section className="learn-panel">
          <div className="learn-tabs" role="tablist" aria-label="Lesson information">{[["overview", "Lesson overview"], ["questions", "Ask a question"], ["resources", "Resources"]].map(([id, label]) => <button key={id} type="button" role="tab" id={"lesson-tab-" + id} aria-selected={tab === id} aria-controls={"lesson-panel-" + id} onClick={() => setTab(id)}>{label}</button>)}</div>
          <div role="tabpanel" id={"lesson-panel-" + tab} aria-labelledby={"lesson-tab-" + tab} tabIndex={0}>
            {tab === "overview" && <><h2>{kind === "TEXT" ? "Lesson" : "Lesson notes"}</h2><p className="learn-prose" style={{ marginTop: 14 }}>{body || "Follow the lesson resource above, then mark the lesson complete to save your progress."}</p></>}
            {tab === "questions" && <><h2>Ask your facilitator</h2><p className="learn-description">Questions are linked to this lesson so your facilitator can help with the right context.</p>{canAccess ? <form onSubmit={askQuestion} className="learn-question-form"><label htmlFor="lesson-question">Your question<textarea id="lesson-question" required minLength={5} maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What would you like help with?" /></label><div className="learn-actions"><button className="learn-button" type="submit" disabled={Boolean(working) || question.trim().length < 5}><MessageCircle size={14} />{working === "question" ? "Sending…" : "Send question"}</button><Link className="learn-text-link" href="/dashboard/user/community">My questions<ArrowRight size={14} /></Link></div></form> : <p className="learn-description">Lesson access is required to ask a question.</p>}</>}
            {tab === "resources" && <><h2>Lesson resources</h2><div className="learn-actions" style={{ marginTop: 16 }}>{source && canAccess && <a className="learn-button secondary" href={source} target="_blank" rel="noopener noreferrer">Open lesson resource<ExternalLink size={14} /></a>}{!source && fileLesson && canAccess && <button className="learn-button secondary" disabled={Boolean(working)} onClick={loadResource}>Load lesson resource</button>}{lesson.quizId && canAccess && <Link className="learn-button secondary" href={"/dashboard/user/quizzes/" + encodeURIComponent(lesson.quizId)}>Open quiz<ArrowRight size={14} /></Link>}{lesson.classId && canAccess && <Link className="learn-button secondary" href={"/dashboard/user/workshops/" + encodeURIComponent(lesson.classId)}>Open linked class<ArrowRight size={14} /></Link>}{!fileLesson && !source && !lesson.quizId && !lesson.classId && <p className="learn-description">No additional resources are attached to this lesson.</p>}</div></>}
          </div>
        </section>
        {courseCompleted && <section className="learn-completion" role="status"><h2>Well done — course completed!</h2><p>Review any lesson or return to the course to share your experience.</p><div className="learn-actions"><Link href={courseHref} className="learn-button">View completed course<ArrowRight size={14} /></Link>{certificateId && <Link href={"/dashboard/user/certificates/" + encodeURIComponent(certificateId)} className="learn-button secondary"><Award size={15} />View certificate</Link>}</div></section>}
        <nav className="learn-lesson-nav" aria-label="Lesson navigation">{previousHref ? <Link className="learn-button secondary" href={previousHref}><ArrowLeft size={14} />Previous lesson</Link> : <Link className="learn-button secondary" href={courseHref}><ArrowLeft size={14} />Course overview</Link>}{canAccess && nextHref && (completed ? <Link className="learn-button" href={nextHref}>Next lesson<ArrowRight size={14} /></Link> : <button className="learn-button" disabled={Boolean(working)} onClick={() => void markComplete(true)}>Complete &amp; continue<ArrowRight size={14} /></button>)}{next && !nextHref && <span className="learn-status is-locked"><LockKeyhole size={12} />Next lesson locked</span>}</nav>
      </div><aside className="learn-aside"><section className="learn-panel"><span className="learn-kicker">YOUR COURSE</span><h2>{courseTitle}</h2><LearningProgress record={progressRecord} />{progressError && <div className="learn-inline-alert" role="alert">{progressError}<button onClick={() => void refreshProgress()}>Retry</button></div>}{percent != null && <p className="learn-results" style={{ marginTop: 12 }}>{Math.round(percent)}% complete</p>}<Link className="learn-text-link" href={courseHref} style={{ marginTop: 16 }}>Course overview<ArrowRight size={13} /></Link></section><section className="learn-panel" style={{ padding: 14 }}><div className="learn-section-heading" style={{ padding: "4px 4px 0" }}><h2>Course content</h2><BookOpen size={18} /></div>{curriculumError ? <div className="learn-inline-alert" role="alert">{curriculumError}<button onClick={() => void loadCurriculum()}>Retry curriculum</button></div> : course ? <Curriculum compact course={course} progress={progress || completionResult || course} courseHref={courseHref} activeLessonId={lessonId} canAccess={course.hasAccess !== false} /> : <p className="learn-description" role="status">Loading curriculum…</p>}</section></aside></div>}
    </>}
  </div></main>;
}
