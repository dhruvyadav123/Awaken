"use client";

import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, listOf, titleOf } from "@/lib/learning-data";

import { joinMessage, formatSchedule } from "@/lib/student-flow";
import { Pagination } from "@/components/dashboard/Elements";
import SessionReschedule from "./SessionReschedule";

export default function MySessions({ bookingId }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1), [pagination, setPagination] = useState(null);
  const lock = useRef(false);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [reason, setReason] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountFetch(bookingId ? `me/sessions/${encodeURIComponent(bookingId)}` : `me/sessions?page=${page}&limit=20`);
      const value = dataOf(result);
      if (bookingId) setBooking(value.booking || value);
      else { setItems(listOf(value, ["sessions", "bookings", "items"])); setPagination(result.pagination); }
      setError("");
    } catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  }, [bookingId, page]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function cancel(event) {
    event.preventDefault();
    if (lock.current || booking?.version == null || !reason.trim()) return; lock.current = true;
    setWorking("cancel"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/sessions/${encodeURIComponent(bookingId)}/cancel`, { method: "POST", body: { version: booking.version, reason: reason.trim() } });
      setNotice(result.message || "Session cancelled."); setReason(""); await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }
  async function getJoinLink() {
    if (lock.current || booking?.hasAccess !== true || booking?.join?.available !== true) return; lock.current = true; setLink("");
    setWorking("join"); setError("");
    try {
      const result = await accountFetch(`me/sessions/${encodeURIComponent(bookingId)}/join`);
      const value = dataOf(result); const url = externalUrl(value) || externalUrl(value?.joining);
      if (!url) throw new Error("Joining link is not available yet.");
      setLink(url);
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  const id = booking?.id || bookingId;
  const slug = booking?.sessionType?.slug || booking?.sessionTypeSlug || booking?.type?.slug || booking?.snapshot?.slug;
  const active = !["CANCELLED", "CANCELED", "COMPLETED", "EXPIRED"].includes(booking?.status);
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href={bookingId ? "/profile/sessions" : "/profile"} className="text-sm font-semibold text-[#315a48] underline">← Back</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">{bookingId ? titleOf(booking?.sessionType || booking?.snapshot || booking, "Session booking") : "My sessions"}</h1>
    {loading && <p className="mt-6" role="status">Loading sessions…</p>}{error && <p className="mt-6 rounded-lg bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 rounded-lg bg-[#edf5ed] p-4 text-sm" role="status">{notice}</p>}
    {!loading && bookingId && booking && <><RecordMedia record={booking.sessionType || booking} imagesOnly /><RecordDetails record={booking} /></>}{!loading && !error && !bookingId && (items.length ? <div className="mt-8 grid gap-4">{items.map((item) => { const entry = item.booking || item; const itemId = entry.id || entry.bookingId; return <article key={itemId} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">{titleOf(entry.sessionType || entry.snapshot || entry, "Private session")}</h2><p className="mt-2 text-sm text-[#647368]">{formatSchedule(entry.startsAt, entry.timezone)} · {entry.status || "Booked"}</p>{itemId && <Link href={`/profile/sessions/${encodeURIComponent(itemId)}`} className="mt-4 inline-block text-sm font-semibold text-[#315a48] underline">Manage booking →</Link>}</article>; })}</div> : <p className="mt-8 rounded-xl bg-white p-6">No session bookings yet. <Link href="/sessions" className="underline">Browse available sessions</Link></p>)}
    {!bookingId && !loading && !error && <Pagination page={page} pagination={pagination} count={items.length} loading={loading} onChange={setPage} />}
    {!loading && bookingId && booking && <div className="mt-8 space-y-6"><section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><p className="text-sm">Status: <strong>{booking.status || "Booked"}</strong></p>{booking.startsAt && <p className="mt-2 text-sm">Starts: {formatSchedule(booking.startsAt, booking.timezone)}</p>}<p role="status" className="mt-3 text-sm text-[#647368]">{joinMessage(booking)}</p><button className="mt-3 text-sm underline" disabled={Boolean(working)} onClick={load}>Refresh booking availability</button><div className="mt-5 flex flex-wrap gap-4"><button type="button" disabled={Boolean(working) || !active || booking.hasAccess !== true || booking.join?.available !== true} onClick={getJoinLink} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working === "join" ? "Loading…" : "Get joining link"}</button>{slug && active && <Link href={`/sessions/${encodeURIComponent(slug)}?reschedule=${encodeURIComponent(id)}`} className="rounded-md border border-[#315a48] px-5 py-3 text-sm font-semibold text-[#315a48]">Choose a new time</Link>}</div>{link && <a href={link} target="_blank" rel="noopener noreferrer" className="mt-4 block text-sm font-semibold text-[#315a48] underline">Open joining link ↗</a>}</section>
      <form onSubmit={cancel} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Cancel booking</h2><label className="mt-4 block text-sm">Reason<textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-[#cbd8cb] p-3" /></label><button disabled={Boolean(working) || !active || booking.version == null || !reason.trim()} className="mt-4 rounded-md border border-[#9f5949] px-5 py-3 text-sm font-semibold text-[#8a4c3c] disabled:opacity-50">{working === "cancel" ? "Cancelling…" : "Confirm cancellation"}</button></form>
      {!slug && <SessionReschedule booking={booking} disabled={!active || Boolean(working)} onChange={async () => { setLink(""); setNotice("Session rescheduled."); await load(); }} />}
    </div>}
  </div></main>;
}
