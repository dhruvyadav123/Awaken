"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Award, BookOpen, Play, RefreshCw, Search, CircleCheck } from "lucide-react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { useApi, rowsOf } from "@/components/common/dashboard/data";
import { courseLearningHref, courseProgress, enrolledCourseId } from "@/lib/course-learning";
import { recordMedia } from "@/lib/record-display";
import { LearningProgress, LearningSkeleton } from "./LearningUI";

function courseInfo(record, base) {
  const course = record.course && typeof record.course === "object" ? record.course : {};
  const id = enrolledCourseId(record);
  const status = String(record.enrollmentStatus || record.enrollment?.status || record.status || "").toUpperCase();
  const progress = courseProgress(record);
  const unavailable = record.hasAccess === false || ["CANCELLED", "CANCELED", "EXPIRED", "REVOKED"].includes(status);
  const completed = record.completed === true || status === "COMPLETED" || progress.percent === 100;
  const started = (progress.percent != null && progress.percent > 0) || Number(progress.completed) > 0 || status === "IN_PROGRESS";
  return {
    id, record, media: { ...record, ...course },
    title: course.title || record.title || record.courseTitle || "Course",
    facilitator: course.facilitatorName || record.facilitatorName || course.facilitator?.name || "",
    unavailable, completed, started,
    label: unavailable ? status === "EXPIRED" ? "Access expired" : "Access unavailable" : completed ? "Completed" : started ? "In progress" : "Ready to start",
    overview: id ? base + "/" + encodeURIComponent(id) : "",
    resume: courseLearningHref(record, base),
    certificateId: record.certificateAvailable ? record.certificateId || record.certificate?.id : "",
  };
}

export default function MyCourses({ embedded = false }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const state = useApi("me/courses?page=" + page + "&limit=20");
  const base = embedded ? "/dashboard/user/courses" : "/profile/courses";
  const courses = rowsOf(state.data, ["courses", "enrollments"]).map((record) => courseInfo(record, base));
  const pages = Math.max(1, Number(state.pagination?.pages || state.pagination?.totalPages) || 1);
  const total = state.pagination?.total ?? state.pagination?.totalItems ?? courses.length;
  const inProgress = courses.filter((course) => course.started && !course.completed && !course.unavailable);
  const counts = { all: courses.length, ongoing: courses.filter((course) => !course.completed && !course.unavailable).length, completed: courses.filter((course) => course.completed && !course.unavailable).length };
  const shown = courses.filter((course) => (course.title + " " + course.facilitator).toLowerCase().includes(search.trim().toLowerCase()) && (filter === "all" || filter === "ongoing" && !course.completed && !course.unavailable || filter === "completed" && course.completed && !course.unavailable));
  const resume = inProgress[0];

  return <section className={"learn-shell " + (embedded ? "is-embedded" : "")} aria-label="My enrolled courses"><div className="learn-container">
    <header className="learn-heading"><div><span className="learn-kicker">YOUR CLASSROOM</span><h1>My courses</h1><p>Choose a course, follow the lessons, and pick up where you left off.</p></div><div className="learn-heading-actions"><Link href="/courses" className="learn-button secondary"><BookOpen size={15} />Explore courses</Link><button type="button" className="learn-button subtle" onClick={state.reload} disabled={state.loading} aria-label="Refresh my courses"><RefreshCw size={15} /></button></div></header>

    {!state.loading && !state.error && courses.length > 0 && <>
      <div className="learn-stats">{[["Enrolled courses", total, BookOpen], [pages > 1 ? "In progress on this page" : "In progress", inProgress.length, Play], [pages > 1 ? "Completed on this page" : "Completed", counts.completed, Award]].map(([label, value, Icon]) => <div className="learn-stat" key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div>
      {resume && page === 1 && !search && filter === "all" && <section className="learn-resume" aria-label="Continue your learning"><div><span className="learn-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>{resume.title}</h2><LearningProgress record={resume.record} /></div><Link href={resume.resume || resume.overview} className="learn-button"><Play size={15} />Continue learning<ArrowRight size={15} /></Link></section>}
    </>}

    <div className="learn-toolbar"><div className="learn-filters" aria-label="Filter my courses">{[["all", "All courses"], ["ongoing", "To complete"], ["completed", "Completed"]].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}{pages === 1 && !state.loading && !state.error && <span>{counts[id]}</span>}</button>)}</div><label className="learn-search"><Search size={16} /><input type="search" aria-label="Search courses on this page" placeholder="Search your courses" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>

    {state.error ? <div className="learn-inline-alert" role="alert">{state.error}<button type="button" onClick={state.reload}>Try again</button>{state.status === 401 && <Link href={"/auth/login?next=" + encodeURIComponent(base)}>Sign in</Link>}</div> : state.loading ? <LearningSkeleton /> : shown.length ? <>
      <p className="learn-results">{shown.length} {shown.length === 1 ? "course" : "courses"}{pages > 1 ? " on page " + page : " in your classroom"}</p>
      <div className="learn-card-grid">{shown.map((info, index) => <article className="learn-course-card" key={info.id || index}>
        <div className="learn-course-cover">{recordMedia(info.media, { imagesOnly: true }).length ? <RecordMedia record={info.media} compact imagesOnly /> : <div className="learn-cover-placeholder"><BookOpen /></div>}<span className="learn-cover-label">{courseProgress(info.record).total != null ? courseProgress(info.record).total + " lessons" : "Your course"}</span></div>
        <div className="learn-card-body"><span className={"learn-status " + (info.unavailable ? "is-locked" : !info.started && !info.completed ? "is-muted" : "")}>{info.completed && !info.unavailable && <CircleCheck size={12} />}{info.label}</span><h2>{info.overview ? <Link href={info.overview}>{info.title}</Link> : info.title}</h2>{info.facilitator && <p className="learn-instructor">With {info.facilitator}</p>}<LearningProgress record={info.record} />
          {info.unavailable && <p className="learn-access-note">Open the course to check your access or contact support.</p>}
          <div className="learn-card-actions">{info.overview && <Link className="learn-button" href={info.unavailable || info.completed ? info.overview : info.resume || info.overview}>{info.unavailable ? "Access details" : info.completed ? "Review course" : info.started ? "Continue learning" : "Start learning"}<ArrowRight size={14} /></Link>}{info.overview && info.resume !== info.overview && !info.unavailable && <Link href={info.overview} className="learn-text-link">Course overview</Link>}{info.certificateId && <Link href={"/dashboard/user/certificates/" + encodeURIComponent(info.certificateId)} className="learn-text-link"><Award size={13} />Certificate</Link>}</div>
        </div>
      </article>)}</div>
    </> : <div className="learn-empty"><BookOpen size={32} /><h3>{courses.length ? "No matching courses" : "Your classroom is ready"}</h3><p>{courses.length ? "Try another course name or clear the filters." : "Your enrolled courses will appear here. Explore the catalogue to get started."}</p>{courses.length ? <button className="learn-button secondary" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button> : <Link className="learn-button" href="/courses">Explore courses<ArrowRight size={15} /></Link>}</div>}
    {pages > 1 && <nav className="learn-pagination" aria-label="My course pages"><button type="button" className="learn-button secondary" disabled={page === 1 || state.loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="learn-button secondary" disabled={page >= pages || state.loading} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </div></section>;
}
