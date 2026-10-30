"use client";
/* eslint-disable @next/next/no-img-element -- Course media can be a backend public URL or an authorized proxy path. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseAssessments from "./CourseAssessments";
import CourseCurriculum from "./CourseCurriculum";
import CourseQuestions from "./CourseQuestions";
import CourseStudents from "./CourseStudents";
import CourseEditor from "./CourseEditor";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { courseWrite, listOf, pathForCourse, recordId, schemas, asDate, mediaPreviewHref, money, titleFromStatus } from "./course-api";
import { btn, lightBtn, Note, panel, Status, Busy, Pager, useLoad } from "./CourseUI";

const tabs = [["overview", "Overview"], ["curriculum", "Curriculum & lessons"], ["students", "Students & progress"], ["assessments", "Assessments"], ["questions", "Questions"]];

function courseImageRecord(course, preferBanner = false) {
  const image = preferBanner ? course.banner || course.thumbnail : course.thumbnail || course.banner;
  const mediaId = preferBanner ? course.bannerMediaId || course.thumbnailMediaId : course.thumbnailMediaId || course.bannerMediaId;
  return { ...course, thumbnail: image || "", thumbnailMediaId: mediaId || "", banner: "", bannerMediaId: "" };
}

function CourseCard({ course, open }) {
  const imageRecord = courseImageRecord(course);
  return <article className="ws-course-card course-list-card"><div className="ws-course-image">{(imageRecord.thumbnail || imageRecord.thumbnailMediaId) ? <RecordMedia record={imageRecord} scope="facilitator" compact imagesOnly /> : <div className="grid h-full place-items-center text-xs text-slate-500">No thumbnail</div>}</div><div className="ws-course-card-body"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="break-words text-sm font-semibold text-[#263e30]">{course.title || "Untitled course"}</h2><p className="mt-1 break-all text-[10px] text-slate-500">/{course.slug}</p></div><Status value={course.status} /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{course.shortDescription || course.description || "No description yet."}</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500"><span>{course.lessonCount || 0} lessons</span><span>{course.sectionCount || 0} sections</span><span>{money(course.discountPrice ?? course.regularPrice, course.currency)}</span></div><button type="button" className={`${lightBtn} mt-3 w-full`} onClick={() => open(recordId(course))}>Manage course</button></div></article>;
}

function Overview({ course, onEdit, onAction, busy }) {
  const banner = mediaPreviewHref(course.banner) || mediaPreviewHref(course.thumbnail);
  const reviewHistory = Array.isArray(course.reviewHistory) ? course.reviewHistory : [];
  const outcomes = Array.isArray(course.learningOutcomes) ? course.learningOutcomes.filter(Boolean) : [];
  const requirements = Array.isArray(course.requirements) ? course.requirements.filter(Boolean) : [];
  return <div className="space-y-5"><section className="overflow-hidden rounded-2xl border border-[#dbe7dd] bg-white shadow-sm"><div className="relative h-44 bg-[#eaf3eb] sm:h-56">{banner && <img src={banner} alt="" className="h-full w-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" /><div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white sm:left-7 sm:right-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">Course workspace</p><h2 className="mt-1 text-2xl font-semibold">{course.title}</h2></div><Status value={course.status} /></div></div><div className="grid gap-4 p-5 sm:grid-cols-4 sm:p-7"><div><p className="text-xs text-slate-500">Price</p><p className="mt-1 font-semibold text-[#315a48]">{money(course.discountPrice ?? course.regularPrice, course.currency)}</p></div><div><p className="text-xs text-slate-500">Lessons</p><p className="mt-1 font-semibold text-[#263e30]">{course.lessonCount || 0}</p></div><div><p className="text-xs text-slate-500">Sections</p><p className="mt-1 font-semibold text-[#263e30]">{course.sectionCount || 0}</p></div><div><p className="text-xs text-slate-500">Updated</p><p className="mt-1 font-semibold text-[#263e30]">{asDate(course.updatedAt)}</p></div></div></section><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><section className={panel}><h3 className="text-lg font-semibold text-[#263e30]">About this course</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{course.description || "Add a full course description."}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-slate-500">Learning outcomes</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{outcomes.length ? outcomes.map((item) => <li key={item}>{item}</li>) : <li>No learning outcomes specified.</li>}</ul></div><div><p className="text-xs text-slate-500">Requirements</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{requirements.length ? requirements.map((item) => <li key={item}>{item}</li>) : <li>No requirements specified.</li>}</ul></div></div></section><section className={panel}><h3 className="text-lg font-semibold text-[#263e30]">Course status</h3><p className="mt-3 text-sm text-slate-600">{titleFromStatus(course.status)}</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Version</dt><dd className="font-semibold">{course.version ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Curriculum</dt><dd className="font-semibold">{course.curriculumVersion ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Certificate</dt><dd className="font-semibold">{course.certificateEnabled ? "Enabled" : "Off"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><button type="button" className={lightBtn} onClick={onEdit}>Edit course</button>{course.status === "DRAFT" && <button type="button" className={btn} disabled={busy} onClick={() => onAction("submit")}>Submit for review</button>}{course.status === "PUBLISHED" && <button type="button" className={lightBtn} disabled={busy} onClick={() => onAction("unpublish")}>Unpublish</button>}{["DRAFT", "PUBLISHED"].includes(course.status) && <button type="button" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={busy} onClick={() => onAction("delete")}>Delete</button>}</div></section></div>{reviewHistory.length > 0 && <section className={panel}><h3 className="text-lg font-semibold text-[#263e30]">Review history</h3><div className="mt-4 space-y-3">{reviewHistory.map((item, index) => <div key={`${item.at}-${index}`} className="rounded-lg bg-[#f4f8f4] p-3"><div className="flex flex-wrap justify-between gap-2"><Status value={item.status} /><span className="text-xs text-slate-500">{asDate(item.at)}</span></div><p className="mt-2 text-sm text-slate-600">{item.reason || "No review note."}</p></div>)}</div></section>}</div>;
}

function CourseActionDialog({ action, busy, onClose, onConfirm }) {
  const copy = action === "submit" ? { title: "Submit course for review", description: "The review team will receive the current course and curriculum.", label: "Submission reason", confirm: "Submit for review", placeholder: "The course content and curriculum are ready for review." } : action === "unpublish" ? { title: "Unpublish course", description: "Learners will no longer see this course as published until you publish it again.", label: "Unpublish reason", confirm: "Unpublish course", placeholder: "I need to make updates to this course." } : { title: "Delete course", description: "This request is sent with the current course version. The backend may reject deletion when dependent activity exists.", label: "Deletion reason", confirm: "Delete course", placeholder: "This draft is no longer needed." };
  const [reason, setReason] = useState(() => copy.placeholder);
  if (!action) return null;
  const danger = action === "delete";
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102a1d]/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="course-action-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b8c75]">Course action</p><h2 id="course-action-title" className="mt-1 text-xl font-semibold text-[#203b2a]">{copy.title}</h2></div><button type="button" className={lightBtn} disabled={busy} onClick={onClose}>Close</button></div><p className="mt-4 text-sm leading-6 text-slate-600">{copy.description}</p><label className="mt-5 block text-sm font-medium text-[#354e40]">{copy.label}<textarea className="mt-1.5 block w-full rounded-lg border border-[#d6e1d9] px-3.5 py-2.5 text-sm outline-none focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10" rows={4} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder={copy.placeholder} /></label><div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" className={lightBtn} disabled={busy} onClick={onClose}>Cancel</button><button type="button" className={danger ? "rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" : btn} disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim())}>{busy ? "Working…" : copy.confirm}</button></div></section></div>;
}

export function CourseList() {
  const [page, setPage] = useState(1);
  const state = useLoad(`facilitator/courses?page=${page}&limit=20`);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState(null);
  const router = useRouter();
  const languages = useLoad(editor !== null ? "facilitator/languages?page=1&limit=100" : null);
  const levels = useLoad(editor !== null ? "facilitator/levels?page=1&limit=100" : null);
  const rows = listOf({ data: state.data });
  const shown = rows.filter((item) => (!status || item.status === status) && `${item.title || ""} ${item.slug || ""}`.toLowerCase().includes(query.toLowerCase()));
  const statuses = [...new Set(rows.map((item) => item.status).filter(Boolean))];
  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("create") === "true") { const timer = setTimeout(() => setEditor({}), 0); return () => clearTimeout(timer); } }, []);
  const lookups = { languages: languages.data, levels: levels.data };
  const lookupLoading = languages.loading || levels.loading;
  const lookupError = languages.error || levels.error;
  const retryLookups = () => Promise.all([languages.reload(), levels.reload()]);
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-6 sm:px-8"><div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8c75]">Facilitator studio</p><h1 className="mt-1 text-3xl font-semibold text-[#203b2a]">My courses</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create, organise and prepare courses for approval from one calm workspace.</p></div><button type="button" className={btn} onClick={() => setEditor({})}>+ Create course</button></div><div className="flex flex-wrap gap-3 rounded-xl border border-[#e0e9e2] bg-white p-3"><input className={`${lightBtn} min-w-[14rem] flex-1 justify-start font-normal`} aria-label="Search courses" placeholder="Search by course title or slug" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><select className={lightBtn} aria-label="Filter courses by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={lightBtn} disabled={state.loading} onClick={state.reload}>Refresh</button></div><Busy state={state} empty="No courses created yet." />{!state.loading && !state.error && <>{shown.length === 0 ? <section className={panel}><p className="text-sm text-slate-600">{rows.length ? "No courses match your filters on this page." : "Create your first course to start building a curriculum."}</p></section> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shown.map((course) => <CourseCard key={recordId(course)} course={course} open={(id) => router.push(`/dashboard/facilitator/courses/${encodeURIComponent(id)}`)} />)}</div>}<Pager pagination={state.pagination} page={page} setPage={setPage} /></>}</div>{editor !== null && <CourseEditor initial={editor.id ? editor : undefined} lookups={lookups} lookupsLoading={lookupLoading} lookupsError={lookupError} onRetryLookups={retryLookups} onClose={() => setEditor(null)} onSaved={async () => { await state.reload(); }} />}</main>;
}

export function CoursePage({ courseId }) {
  const router = useRouter();
  const state = useLoad(pathForCourse(courseId));
  const [tab, setTab] = useState("overview");
  const [editor, setEditor] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const languages = useLoad(editor ? "facilitator/languages?page=1&limit=100" : null);
  const levels = useLoad(editor ? "facilitator/levels?page=1&limit=100" : null);
  const course = state.data?.course || state.data;
  const lookupLoading = languages.loading || levels.loading;
  const lookupError = languages.error || levels.error;
  const retryLookups = () => Promise.all([languages.reload(), levels.reload()]);

  async function action(kind, reason) {
    setBusy(true); setError("");
    try {
      await courseWrite({ method: kind === "delete" ? "DELETE" : "POST", path: `${pathForCourse(courseId)}/${kind === "delete" ? "" : kind}`.replace(/\/$/, ""), template: kind === "delete" ? schemas.deleteCourse : kind === "submit" ? schemas.submit : schemas.unpublish, courseId, values: { reason: reason.trim() }, versionPath: pathForCourse(courseId), onConflict: state.reload });
      setActionDialog(null);
      if (kind === "delete") router.push("/dashboard/facilitator/courses"); else await state.reload();
    } catch (caught) { setError(caught.message || "Course action failed."); } finally { setBusy(false); }
  }

  if (state.loading) return <main className="mx-auto max-w-7xl p-6"><Busy state={state} /></main>;
  if (state.error || !course) return <main className="mx-auto max-w-7xl p-6"><Busy state={state} empty="Course not found." /></main>;
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-6 sm:px-8"><div className="mx-auto max-w-7xl space-y-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/dashboard/facilitator/courses" className="text-sm font-semibold text-[#315a48] hover:underline">← All courses</Link><h1 className="mt-2 break-words text-3xl font-semibold text-[#203b2a]">{course.title}</h1><p className="mt-1 text-sm text-slate-500">/{course.slug} · Updated {asDate(course.updatedAt)}</p></div><Status value={course.status} /></div><Note error={error} /><nav className="flex gap-2 overflow-x-auto border-b border-[#dbe7dd]" aria-label="Course sections">{tabs.map(([key, title]) => <button type="button" key={key} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${tab === key ? "border-[#315a48] text-[#315a48]" : "border-transparent text-slate-500 hover:text-[#315a48]"}`} onClick={() => setTab(key)}>{title}</button>)}</nav>{tab === "overview" && <Overview course={course} busy={busy} onEdit={() => setEditor(course)} onAction={setActionDialog} />}{tab === "curriculum" && <CourseCurriculum courseId={courseId} course={course} />}{tab === "students" && <CourseStudents courseId={courseId} />}{tab === "assessments" && <CourseAssessments courseId={courseId} course={course} />}{tab === "questions" && <CourseQuestions courseId={courseId} />}</div>{editor && <CourseEditor initial={editor} lookups={{ languages: languages.data, levels: levels.data }} lookupsLoading={lookupLoading} lookupsError={lookupError} onRetryLookups={retryLookups} onClose={() => setEditor(null)} onSaved={() => state.reload()} />}{actionDialog && <CourseActionDialog key={actionDialog} action={actionDialog} busy={busy} onClose={() => setActionDialog(null)} onConfirm={(reason) => action(actionDialog, reason)} />}</main>;
}
