"use client";
import Link from "next/link";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { useState } from "react";
import { useApi, rowsOf } from "@/components/dashboard/data";
import { enrolledCourseId, courseLearningHref, courseProgress } from "@/lib/course-learning";

export default function MyCourses({ embedded = false }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const state = useApi(`me/courses?page=${page}&limit=20`);
  const rows = rowsOf(state.data, ["courses", "enrollments"]);
  const base = embedded ? "/dashboard/user/courses" : "/profile/courses";
  const shown = rows.filter((row) => (row.title || row.course?.title || "").toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Number(state.pagination?.pages) || 1;
  return <section className={embedded ? "text-[#29473c]" : "bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8"}><div className="mx-auto max-w-5xl">
    {!embedded && <><Link href="/profile" className="text-sm text-[#315a48] hover:underline">&larr; My account</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">My courses</h1></>}
    <p className="mt-3 text-sm leading-7 text-[#647368]">Continue your enrolled courses and track your lessons.</p>
    <div className="my-6 flex flex-wrap items-center gap-3"><input aria-label="Search courses on this page" placeholder="Search this page" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 border-b border-[#cbd8cb] bg-transparent py-2 text-sm" /><button type="button" disabled={state.loading} onClick={state.reload} className="px-3 py-2 text-sm text-[#315a48] disabled:opacity-50">Refresh</button><Link href="/courses" className="px-3 py-2 text-sm text-[#315a48] hover:underline">Browse courses</Link></div>
    {state.loading && <p role="status">Loading your courses...</p>}
    {state.error && <p role="alert" className="py-4 text-sm text-[#8a4c3c]">{state.error} <button type="button" onClick={state.reload} className="underline">Try again</button>{state.status === 401 && <Link href="/auth/login" className="ml-4 underline">Sign in</Link>}</p>}
    {!state.loading && !state.error && <>
      {!shown.length && <p className="py-6 text-sm text-[#647368]">{rows.length ? "No matching courses on this page." : "No enrolled courses yet. Browse courses to start learning."}</p>}
      <ul className="divide-y divide-[#dfe7dd]">{shown.map((record) => {
        const item = record.course ? { ...record.course, ...record } : record;
        const id = enrolledCourseId(record);
        const progress = courseProgress(record);
        const href = courseLearningHref(record, base);
        return <li key={record.id || id} className="flex min-w-0 flex-col gap-5 py-7 sm:flex-row">
          <div className="w-44 shrink-0"><RecordMedia record={item} compact imagesOnly /></div>
          <div className="min-w-0 flex-1"><p className="text-xs text-[#647368]">{String(record.enrollmentStatus || record.enrollment?.status || "Enrolled").replaceAll("_", " ")}</p><h2 className="mt-2 break-words font-[Georgia,serif] text-2xl">{item.title || "Course"}</h2>
            {item.facilitatorName && <p className="mt-2 text-sm text-[#647368]">With {item.facilitatorName}</p>}
            <div className="mt-4 text-sm text-[#647368]">{progress.completed != null && progress.total != null && <p>{progress.completed} of {progress.total} lessons completed</p>}{progress.percent != null && <><progress className="mt-2 h-2 w-full max-w-sm accent-[#315a48]" value={progress.percent} max={100} aria-label={`${item.title || "Course"} progress`} /><p className="mt-1">{progress.percent}% complete</p></>}</div>
            {record.hasAccess === false && <p className="mt-3 text-sm text-[#8a4c3c]">Course access is currently unavailable.</p>}
            {record.certificateAvailable && record.certificateId && <Link prefetch={false} href={`/profile/certificates/${encodeURIComponent(record.certificateId)}`} className="mt-3 inline-block text-sm text-[#315a48] underline">View certificate</Link>}
          </div>
          {href && <Link prefetch={false} href={href} className="shrink-0 self-start py-2 text-sm font-semibold text-[#315a48] hover:underline">{record.hasAccess === false ? "View access details" : record.completed || record.enrollmentStatus === "COMPLETED" ? "Review course" : "Continue learning"} &rarr;</Link>}
        </li>;
      })}</ul>
      {pages > 1 && <nav aria-label="My courses pages" className="mt-8 flex flex-wrap items-center gap-5 text-sm"><button disabled={page <= 1 || state.loading} onClick={() => {setPage(page - 1); setSearch("");}} className="text-[#315a48] disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages || state.loading} onClick={() => {setPage(page + 1); setSearch("");}} className="text-[#315a48] disabled:opacity-40">Next</button></nav>}
    </>}
  </div></section>;
}
