"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { dataOf } from "@/lib/learning-data";

export default function SessionSlotAction({ sessionTypeId, availabilityId, startsAt, rescheduleBookingId }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const intentKey = useRef("");
  const lock = useRef(false);
  const [reason, setReason] = useState("");
  async function act() {
    if (lock.current || !sessionTypeId || !availabilityId || !startsAt || (rescheduleBookingId && !reason.trim())) return; lock.current = true;
    setWorking(true); setError(""); setNotice("");
    try {
      if (rescheduleBookingId) {
        const detail = await accountFetch(`me/sessions/${encodeURIComponent(rescheduleBookingId)}`);
        const value = dataOf(detail); const booking = value.booking || value;
        if (booking.version == null) throw new Error("Booking version is unavailable. Refresh your booking and try again.");
        const result = await accountFetch(`me/sessions/${encodeURIComponent(rescheduleBookingId)}/reschedule`, { method: "POST", body: { version: booking.version, availabilityId, startsAt, reason: reason.trim() } });
        setNotice(result.message || "Session rescheduled."); router.push(`/profile/sessions/${encodeURIComponent(rescheduleBookingId)}`);
      } else {
        intentKey.current ||= crypto.randomUUID();
        const result = await accountFetch("me/sessions/", { method: "POST", body: { sessionTypeId, availabilityId, startsAt, idempotencyKey: intentKey.current } });
        const value = dataOf(result); const id = value.booking?.id || value.id || value.bookingId;
        if (!id) throw new Error("The booking could not be confirmed. Retry or check My sessions before booking again.");
        router.push(`/profile/sessions/${encodeURIComponent(id)}`);
      }
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }
  return <div className="mt-4">{rescheduleBookingId && <label className="mb-3 block text-xs">Reason for changing time<input required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded border border-[#cbd8cb] p-2" /></label>}<button type="button" disabled={working || !sessionTypeId || !availabilityId || !startsAt || (rescheduleBookingId && !reason.trim())} onClick={act} className="rounded-md bg-[#315a48] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{working ? "Submitting…" : rescheduleBookingId ? "Choose this time" : "Book this time"}</button>{error && <p role="alert" className="mt-2 text-xs text-[#8a4c3c]">{error}{error.toLowerCase().includes("sign in") && <> <Link href={`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="underline">Sign in</Link></>}</p>}{notice && <p role="status" className="mt-2 text-xs text-[#315a48]">{notice} <Link href="/profile/sessions" className="underline">My sessions</Link></p>}</div>;
}
