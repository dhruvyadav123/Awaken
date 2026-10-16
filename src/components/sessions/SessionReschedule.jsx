"use client";
import { useRef, useState } from "react";
import { useApi, rowsOf } from "@/components/dashboard/data";
import { Pagination } from "@/components/dashboard/Elements";
import { accountFetch } from "@/lib/client-account";
import { formatSchedule, requiredVersion } from "@/lib/student-flow";

export default function SessionReschedule({ booking, onChange, disabled }) {
  const [from, setFrom] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()));
  const [page, setPage] = useState(1), [selected, setSelected] = useState(""), [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false);
  const start = from ? new Date(from + "T00:00:00.000Z") : null;
  const end = start && Number.isFinite(start.getTime()) ? new Date(start.getTime() + 14 * 86400000) : null;
  const state = useApi(booking.sessionTypeId && end ? `public/session-types/${encodeURIComponent(booking.sessionTypeId)}/slots?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}&page=${page}&limit=20` : null);
  const slots = rowsOf(state.data, ["slots", "availability"]);
  async function submit(event) {
    event.preventDefault(); if (lock.current || disabled) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const slot = slots[Number(selected)];
      if (selected === "" || !slot || !reason.trim()) throw new Error("Choose an available time and enter a reason.");
      const availabilityId = slot.availabilityId || slot.id, startsAt = slot.startsAt || slot.startAt;
      if (!availabilityId || !startsAt || slot.available === false) throw new Error("That time is unavailable. Refresh the available times.");
      await accountFetch(`me/sessions/${encodeURIComponent(booking.id)}/reschedule`, { method: "POST", body: { version: requiredVersion(booking.version, "booking"), availabilityId, startsAt, reason: reason.trim() } });
      setSelected(""); setReason(""); await onChange();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Reschedule booking</h2><fieldset disabled={disabled || busy} className="mt-4 space-y-4"><label className="block text-sm">Show times from<input className="mt-2 block rounded border border-[#cbd8cb] p-3" required type="date" value={from} onChange={event => { setFrom(event.target.value); setSelected(""); setPage(1); }} /></label>{state.loading && <p role="status">Loading available times…</p>}{(state.error || error) && <p role="alert">{error || state.error} <button type="button" className="underline" onClick={state.reload}>Refresh times</button></p>}<label className="block text-sm">Available time<select className="mt-2 w-full rounded border border-[#cbd8cb] bg-white p-3" value={selected} disabled={state.loading || Boolean(state.error)} onChange={event => setSelected(event.target.value)} required><option value="">Choose an available time</option>{slots.map((slot, index) => <option key={(slot.id || slot.availabilityId) + (slot.startsAt || slot.startAt)} value={index} disabled={slot.available === false || slot.remainingCapacity === 0}>{formatSchedule(slot.startsAt || slot.startAt, booking.timezone)}</option>)}</select></label>{!state.loading && !state.error && !slots.length && <p>No openings were returned for this date range.</p>}<Pagination page={page} pagination={state.pagination} count={slots.length} loading={state.loading || busy} onChange={value => { setPage(value); setSelected(""); }} /><label className="block text-sm">Reason for rescheduling<textarea className="mt-2 min-h-24 w-full rounded border border-[#cbd8cb] p-3" required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label><button disabled={busy || state.loading || Boolean(state.error) || selected === "" || !reason.trim() || booking.version == null} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Rescheduling…" : "Confirm new time"}</button></fieldset></form>;
}
