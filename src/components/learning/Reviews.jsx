"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf, titleOf } from "@/lib/learning-data";

import { Pagination } from "@/components/dashboard/Elements";
const fieldClass = "mt-2 block w-full rounded border border-[#cbd8cb] bg-white p-3";

export function CourseReviewForm({ courseId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setWorking(true); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/courses/${encodeURIComponent(courseId)}/reviews`, { method: "POST", body: { rating: Number(rating), comment: comment.trim() } });
      setNotice(result.message || "Review submitted."); setComment("");
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }
  return <form onSubmit={submit} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Review this course</h2><div className="mt-4 grid gap-4 sm:grid-cols-[130px_1fr]"><label className="text-sm">Rating<select value={rating} onChange={(event) => setRating(event.target.value)} className={fieldClass}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="text-sm">Your feedback<textarea required minLength={5} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} className={`${fieldClass} min-h-28`} /></label></div>{error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-[#315a48]">{notice}</p>}<div className="mt-4 flex flex-wrap items-center gap-4"><button type="submit" disabled={working || comment.trim().length < 5} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Submitting…" : "Submit review"}</button><Link href="/profile/reviews" className="text-sm font-semibold text-[#315a48] underline">My reviews</Link></div></form>;
}

export default function MyReviews() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1), [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const lock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await accountFetch(`me/reviews?page=${page}&limit=20`); setItems(listOf(dataOf(result), ["reviews", "items"])); setPagination(result.pagination); setError(""); }
    catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function startEdit(item) { setEditing(item); setRating(item.rating || 5); setComment(item.comment || ""); setError(""); setNotice(""); }
  async function save(event) {
    event.preventDefault();
    if (lock.current || editing?.version == null) return; lock.current = true;
    setWorking(true); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/reviews/${encodeURIComponent(editing.id)}`, { method: "PATCH", body: { version: editing.version, rating: Number(rating), comment: comment.trim() } });
      setNotice(result.message || "Review updated."); setEditing(null); await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }

  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href="/profile" className="text-sm font-semibold text-[#315a48] underline">← My account</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">My reviews</h1>
    {loading && <p className="mt-6" role="status">Loading reviews…</p>}{error && <p className="mt-6 text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 text-[#315a48]" role="status">{notice}</p>}
    {!loading && !error && (items.length ? <div className="mt-8 grid gap-4">{items.map((item) => <article key={item.id} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-xl">{titleOf(item.course || item, "Course review")}</h2><p className="mt-2 text-sm">{item.rating} / 5 ? {item.status}</p>{item.moderationReason && <p className="mt-2 text-sm">{item.moderationReason}</p>}{item.courseId && <Link className="mt-2 inline-block text-sm underline" href={`/profile/courses/${encodeURIComponent(item.courseId)}`}>View course</Link>}<p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#647368]">{item.comment}</p><button type="button" onClick={() => startEdit(item)} className="mt-4 text-sm font-semibold text-[#315a48] underline">Edit review</button></article>)}</div> : <p className="mt-8 rounded-xl bg-white p-6">No reviews submitted yet.</p>)}
    <Pagination page={page} pagination={pagination} count={items.length} loading={loading || working} onChange={setPage} />
    {editing && <form onSubmit={save} className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Edit review</h2><label className="mt-4 block text-sm">Rating<select value={rating} onChange={(event) => setRating(event.target.value)} className={fieldClass}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="mt-4 block text-sm">Feedback<textarea required minLength={5} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} className={`${fieldClass} min-h-28`} /></label><div className="mt-4 flex gap-4"><button disabled={working || comment.trim().length < 5} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Saving…" : "Save review"}</button><button type="button" onClick={() => setEditing(null)} className="text-sm underline">Cancel</button></div></form>}
  </div></main>;
}
