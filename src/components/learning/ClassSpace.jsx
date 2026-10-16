"use client";

import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { registrationVersion, joinMessage, formatSchedule } from "@/lib/student-flow";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, titleOf } from "@/lib/learning-data";

const button = "rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#254638] disabled:opacity-50";

export default function ClassSpace({ classId }) {
  const lock = useRef(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [notice, setNotice] = useState("");
  const [links, setLinks] = useState({});
  const [reason, setReason] = useState("");
  const [registeredAfterAction, setRegisteredAfterAction] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErrorStatus(null); setLinks({});
    try {
      const result = await accountFetch(`me/classes/${encodeURIComponent(classId)}`);
      const value = dataOf(result);
      setItem(value?.class ? { ...value.class, registration: value.registration ?? value.class.registration, registrationStatus: value.registrationStatus ?? value.class.registrationStatus } : value);
      setError("");
    } catch (caught) { setError(caught.message); setErrorStatus(caught.status); }
    finally { setLoading(false); }
  }, [classId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function register() {
    if (lock.current) return; lock.current = true;
    setWorking("register"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/classes/${encodeURIComponent(classId)}/registrations`, { method: "POST", body: {} });
      setNotice(result.message || "Class registration submitted.");
      setRegisteredAfterAction(["REGISTERED", "CONFIRMED", "WAITLISTED"].includes(result.data?.status));
      await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function cancel(event) {
    event.preventDefault();
    if (lock.current || !reason.trim()) return; lock.current = true;
    setWorking("cancel"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/classes/${encodeURIComponent(classId)}/cancel`, {
        method: "POST", body: { version: registrationVersion(item), reason: reason.trim() },
      });
      setNotice(result.message || "Class cancellation submitted.");
      setReason(""); setLinks({}); setRegisteredAfterAction(false);
      await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function getLink(kind) {
    if (lock.current) return; lock.current = true;
    setLinks(current => ({ ...current, [kind]: "" }));
    setWorking(kind); setError("");
    try {
      const result = await accountFetch(`me/classes/${encodeURIComponent(classId)}/${kind}`);
      const value = dataOf(result);
      const url = externalUrl(value) || externalUrl(value?.[kind]);
      if (!url) throw new Error(`${kind === "join" ? "Joining" : "Recording"} link is not available yet.`);
      setLinks((current) => ({ ...current, [kind]: url }));
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  const status = String(item?.registrationStatus || item?.registration?.status || "").toUpperCase();
  const cancelled = ["CANCELLED", "CANCELED"].includes(status);
  const registered = !cancelled && (registeredAfterAction || item?.registrationId != null || item?.isRegistered === true || item?.registered === true || item?.registration?.id != null || ["REGISTERED", "WAITLISTED", "CONFIRMED", "BOOKED", "ACTIVE"].includes(status));
  const version = item?.registrationVersion ?? item?.registration?.version;

  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/classes" className="text-sm font-semibold text-[#315a48] hover:underline">← Browse classes</Link>
    <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">My class</p>
    {!loading && item && <><RecordMedia record={item} imagesOnly /><RecordDetails record={item} /></>}<h1 className="mt-3 font-[Georgia,serif] text-4xl">{titleOf(item, "Class details")}</h1>
    {loading && <p className="mt-6" role="status">Loading class details…</p>}
    {error && <p className="mt-6 rounded-lg bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href={`/auth/login?next=${encodeURIComponent(`/profile/classes/${classId}`)}`} className="underline">Sign in</Link></>}</p>}
    {notice && <p className="mt-6 rounded-lg bg-[#edf5ed] p-4 text-sm" role="status">{notice}</p>}
    {!loading && <div className="mt-8 space-y-6">
      {(item?.description || item?.shortDescription) && <p className="leading-7 text-[#647368]">{item.description || item.shortDescription}</p>}
      {status && <p className="text-sm">Status: <strong>{status.replaceAll("_", " ").toLowerCase()}</strong></p>}
      {item?.startsAt && <p className="text-sm">{formatSchedule(item.startsAt, item.timezone)}{item.endsAt && ` — ${formatSchedule(item.endsAt, item.timezone)}`}</p>}
      {item && <p role="status" className="text-sm text-[#647368]">{joinMessage(item)}</p>}
      <button className="text-sm underline" disabled={Boolean(working) || loading} onClick={load}>Refresh class availability</button>
      <div className="flex flex-wrap gap-3">
        {!registered && <button className={button} type="button" disabled={Boolean(working) || (!item && errorStatus !== 404)} onClick={register}>{working === "register" ? "Registering…" : cancelled ? "Register again" : "Register for class"}</button>}
        {item && <button className={button} type="button" disabled={Boolean(working) || item.hasAccess !== true || item.join?.available !== true} onClick={() => getLink("join")}>{working === "join" ? "Loading…" : "Get joining link"}</button>}
        {item && <button className={button} type="button" disabled={Boolean(working) || item.hasAccess !== true || item.recordingAvailable !== true} onClick={() => getLink("recording")}>{working === "recording" ? "Loading…" : "Get recording"}</button>}
      </div>
      {links.join && <a href={links.join} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-[#315a48] underline">Open class joining link ↗</a>}
      {links.recording && <RecordMedia scope="learner" record={{ videoUrl: links.recording }} />}{links.recording && <a href={links.recording} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-[#315a48] underline">Open class recording ↗</a>}
      {registered && <form onSubmit={cancel} className="rounded-xl border border-[#dfe7dd] bg-white p-6">
        <h2 className="font-[Georgia,serif] text-2xl">Cancel class</h2>
        <label className="mt-4 block text-sm">Reason for cancellation<textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 block min-h-24 w-full rounded border border-[#cbd8cb] p-3" /></label>
        <button type="submit" disabled={Boolean(working) || version == null || !reason.trim()} className="mt-4 rounded-md border border-[#9f5949] px-5 py-3 text-sm font-semibold text-[#8a4c3c] disabled:opacity-50">{working === "cancel" ? "Cancelling…" : "Confirm cancellation"}</button>
      </form>}
    </div>}
  </div></main>;
}
