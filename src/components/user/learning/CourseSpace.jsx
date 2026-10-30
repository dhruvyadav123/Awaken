"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Award, BookOpen, CheckCircle2, MessageCircle, Play, RefreshCw, UserRound } from "lucide-react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { accountFetch } from "@/lib/client-account";
import { dataOf, lessonsOf, titleOf } from "@/lib/learning-data";
import { completedLesson, courseLearningHref, courseProgress, lessonLocked, normalizeLearningCourse } from "@/lib/course-learning";
import { recordMedia } from "@/lib/record-display";
import { Curriculum, LearningBreadcrumb, LearningProgress, LearningSkeleton } from "./LearningUI";

const MembershipDiscount = dynamic(() => import("@/components/user/membership/MyMembership").then((module) => module.MembershipDiscount));
const CourseReviewForm = dynamic(() => import("./Reviews").then((module) => module.CourseReviewForm));

export default function CourseSpace({ courseId }) {
  const pathname = usePathname();
  const embedded = pathname.startsWith("/dashboard/");
  const base = embedded ? "/dashboard/user/courses" : "/profile/courses";
  const courseHref = base + "/" + encodeURIComponent(courseId);
  const path = "me/courses/" + encodeURIComponent(courseId);
  const seq = useRef(0);
  const enrollLock = useRef(false);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("content");

  const refreshProgress = useCallback(async (token = seq.current) => {
    setProgressLoading(true); setProgressError("");
    try { const result = await accountFetch(path + "/progress"); if (token === seq.current) setProgress(dataOf(result)); }
    catch (caught) { if (token === seq.current) setProgressError(caught.message); }
    finally { if (token === seq.current) setProgressLoading(false); }
  }, [path]);

  const load = useCallback(async () => {
    const token = ++seq.current;
    setLoading(true); setError(""); setStatus(null); setProgress(null);
    try {
      const record = normalizeLearningCourse(dataOf(await accountFetch(path)));
      if (token !== seq.current) return;
      setCourse(record);
      if (record.hasAccess !== false) void refreshProgress(token);
    } catch (caught) {
      if (token === seq.current) { setCourse(null); setError(caught.message); setStatus(caught.status); }
    } finally { if (token === seq.current) setLoading(false); }
  }, [path, refreshProgress]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => { clearTimeout(timer); seq.current++; };
  }, [load]);

  async function enroll() {
    if (enrollLock.current) return;
    enrollLock.current = true; setWorking(true); setError("");
    try { const result = await accountFetch(path + "/enroll", { method: "POST", body: {} }); setNotice(result.message || "Enrollment confirmed."); await load(); }
    catch (caught) { setError(caught.message); setStatus(caught.status); }
    finally { enrollLock.current = false; setWorking(false); }
  }

  const lessons = lessonsOf(course);
  const enrollmentStatus = String(course?.enrollmentStatus || course?.enrollment?.status || "").toUpperCase();
  const canAccess = Boolean(course) && course.hasAccess !== false && !["CANCELLED", "EXPIRED", "REVOKED"].includes(enrollmentStatus);
  const values = courseProgress(progress || course);
  const complete = course?.completed === true || enrollmentStatus === "COMPLETED" || values.percent === 100;
  const title = titleOf(course, "Course overview");
  const resume = courseLearningHref({ ...course, courseId }, base);
  const nextLesson = lessons.find((lesson) => !lessonLocked(lesson) && !completedLesson(progress || course, lesson.id || lesson.lessonId)) || lessons.find((lesson) => !lessonLocked(lesson));
  const nextId = nextLesson?.id || nextLesson?.lessonId;
  const start = resume && resume !== courseHref ? resume : nextId ? courseHref + "/lessons/" + encodeURIComponent(nextId) : "";
  const instructor = course?.facilitatorName || course?.facilitator?.name || course?.instructorName;
  const certificateId = course?.certificateAvailable && (course.certificateId || course.certificate?.id);

  return <main className={"learn-shell " + (embedded ? "is-embedded" : "")}><div className="learn-container">
    <LearningBreadcrumb base={base} courseTitle={course ? title : "Course overview"} />
    {loading ? <LearningSkeleton /> : !course ? <section className="learn-panel"><span className="learn-kicker">YOUR CLASSROOM</span><h1>Course access</h1>{error && <p className="learn-inline-alert" role="alert">{error}</p>}{notice && <p className="learn-notice" role="status">{notice}</p>}{status === 401 ? <Link className="learn-button" href={"/auth/login?next=" + encodeURIComponent(pathname)}>Sign in to continue</Link> : <>{[403, 404].includes(status) && <><p className="learn-description">Open the course catalogue to check enrollment options, or request access to this course.</p><MembershipDiscount courseId={courseId} /><div className="learn-actions" style={{ marginTop: 20 }}><button type="button" className="learn-button" onClick={enroll} disabled={working}>{working ? "Requesting…" : "Request enrollment"}</button><Link className="learn-button secondary" href="/courses">Explore courses</Link></div></>}<button type="button" onClick={() => void load()} className="learn-button subtle">Retry loading</button></>}</section> : <>
      <header className="learn-course-hero"><div><span className="learn-kicker">COURSE OVERVIEW</span><h1>{title}</h1>{course.shortDescription && <p className="learn-description">{course.shortDescription}</p>}<div className="learn-meta">{instructor && <span><UserRound size={14} />{instructor}</span>}<span><BookOpen size={14} />{lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}</span>{course.language && <span>{typeof course.language === "string" ? course.language : course.language.name}</span>}<span className={"learn-status " + (!canAccess ? "is-locked" : "")}>{!canAccess ? "Access unavailable" : complete ? "Completed" : "Enrolled"}</span></div><div className="learn-actions">{canAccess && start && <Link className="learn-button" href={start}><Play size={15} />{complete ? "Review lessons" : Number(values.percent) > 0 ? "Continue learning" : "Start learning"}<ArrowRight size={15} /></Link>}<a className="learn-button secondary" href="#course-content" onClick={() => setTab("content")}><BookOpen size={15} />View curriculum</a></div></div><div className="learn-course-cover">{recordMedia(course, { imagesOnly: true }).length ? <RecordMedia record={course} compact imagesOnly /> : <div className="learn-cover-placeholder"><BookOpen /></div>}</div></header>
      {notice && <p className="learn-notice" role="status">{notice}</p>}
      {!canAccess && <div className="learn-inline-alert" role="status">Your lesson access is currently unavailable.<Link href="/contact">Contact support</Link></div>}
      {complete && <div className="learn-completion"><h2><CheckCircle2 size={20} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />Course completed</h2><p>You have reached the end of this course. Revisit a lesson or share your experience.</p>{certificateId && <div className="learn-actions"><Link className="learn-button" href={"/dashboard/user/certificates/" + encodeURIComponent(certificateId)}><Award size={15} />View certificate</Link></div>}</div>}
      <div className="learn-layout" style={{ marginTop: 24 }}><section id="course-content" className="learn-panel" style={{ scrollMarginTop: 100 }}>
        <div className="learn-tabs" role="tablist" aria-label="Course information">{[["content", "Course content"], ["overview", "About this course"], ["review", "Your review"]].map(([id, label]) => <button role="tab" type="button" id={"course-tab-" + id} aria-selected={tab === id} aria-controls={"course-panel-" + id} key={id} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div role="tabpanel" id={"course-panel-" + tab} aria-labelledby={"course-tab-" + tab} tabIndex={0}>
          {tab === "content" && <><div className="learn-section-heading"><div><h2>Course lessons</h2><p>Follow the modules in order. Your completed lessons are marked below.</p></div><span>{lessons.length} lessons</span></div><Curriculum course={course} progress={progress || course} courseHref={courseHref} canAccess={canAccess} /></>}
          {tab === "overview" && <><h2>About this course</h2><p className="learn-description learn-prose">{course.description || course.shortDescription || "Your course curriculum is available in the Course content tab."}</p>{Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0 && <><h3 style={{ marginTop: 24 }}>What you will learn</h3><ul className="learn-prose" style={{ paddingLeft: 20, listStyle: "disc" }}>{course.learningOutcomes.map((outcome, index) => <li key={index}>{typeof outcome === "string" ? outcome : outcome.title || outcome.text}</li>)}</ul></>}</>}
          {tab === "review" && (canAccess ? <CourseReviewForm courseId={courseId} /> : <p className="learn-description">Course access is required to submit a review.</p>)}
        </div>
      </section><aside className="learn-aside"><section className="learn-panel"><h2>Your learning progress</h2><LearningProgress record={progress || course} />{progressError && <div className="learn-inline-alert" role="alert">{progressError}</div>}<div className="learn-actions">{canAccess && start && <Link className="learn-button" href={start}>{complete ? "Review course" : "Go to lesson"}<ArrowRight size={15} /></Link>}<button className="learn-button subtle" onClick={() => void refreshProgress()} disabled={progressLoading}><RefreshCw size={13} />{progressLoading ? "Updating progress…" : "Refresh progress"}</button></div></section><section className="learn-panel learn-help"><MessageCircle size={23} style={{ marginBottom: 12 }} /><h3>Need a little guidance?</h3><p>Open a lesson to ask your facilitator a question. Your conversation stays in My questions.</p><Link href="/dashboard/user/community" className="learn-text-link">My questions<ArrowRight size={14} /></Link></section></aside></div>
    </>}
  </div></main>;
}
