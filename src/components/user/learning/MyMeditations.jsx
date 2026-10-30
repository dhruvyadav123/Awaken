"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import { accountFetch } from "@/lib/client-account";
import { externalUrl } from "@/lib/learning-data";
import { useApi, rowsOf } from "@/components/common/dashboard/data";
import { Pagination } from "@/components/common/dashboard/Elements";

export default function MyMeditations({ meditationId }) {
  const [page, setPage] = useState(1);
  const state = useApi(meditationId ? `me/meditations/${encodeURIComponent(meditationId)}` : `me/meditations?page=${page}&limit=20`);
  const meditation = meditationId ? state.data?.meditation || state.data : null;
  const content = useApi(meditation?.hasAccess === true ? `me/meditations/${encodeURIComponent(meditationId)}/content` : null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [expired, setExpired] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = setTimeout(() => setExpired(true), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  async function access() {
    if (lock.current || meditation?.hasAccess !== true) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setLink("");
    try {
      const value = (await accountFetch(`me/meditations/${encodeURIComponent(meditationId)}/access-link`, { method: "POST", body: {} })).data;
      const url = externalUrl(value);
      if (!url) throw Error("Meditation access is unavailable. Please try again.");
      setLink(url);
      setExpired(false);
      setExpiresAt(value.expiresIn > 0 ? Date.now() + value.expiresIn * 1000 : 0);
    } catch (caught) {
      setError(caught.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const items = rowsOf(state.data, ["meditations"]);
  const kind = content.data?.contentType || meditation?.contentType;
  const text = typeof content.data === "string" ? content.data : content.data?.content || content.data?.body || content.data?.text || content.data?.script;
  function mediaError() {
    setLink("");
    setError("Playback is unavailable. Request fresh access and try again.");
  }

  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-10 text-[#29473c]"><div className="mx-auto max-w-4xl">
    <Link href={meditationId ? "/profile/meditations" : "/profile"} className="text-sm underline">Back</Link>
    <h1 className="mt-6 font-[Georgia,serif] text-3xl sm:text-4xl">{meditationId ? meditation?.title || "Meditation" : "My meditations"}</h1>
    <button className="mt-3 text-sm underline disabled:opacity-50" disabled={state.loading || busy} onClick={state.reload}>Refresh meditations</button>
    {state.loading && <p role="status" className="mt-6">Loading meditations…</p>}
    {(state.error || error) && <p role="alert" className="mt-6 text-[#8a4c3c]">{error || state.error}</p>}
    {!state.loading && !state.error && (meditationId ? meditation && <div className="mt-8 space-y-5">
      <div className="max-w-xl overflow-hidden rounded-xl"><RecordMedia record={meditation} imagesOnly /></div>
      <RecordDetails record={meditation} />
      {meditation.description && <p className="leading-7 text-[#647368]">{meditation.description}</p>}
      {meditation.hasAccess !== true && <p role="status">Access is currently unavailable. <Link href="/profile/membership" className="underline">Check your membership</Link>, then refresh this meditation.</p>}
      {content.loading && <p role="status">Loading meditation content…</p>}
      {content.error && <p role="alert">{content.error} <button onClick={content.reload} className="underline">Retry content</button></p>}
      {text && <div className="whitespace-pre-line rounded-xl bg-white p-6 leading-8">{text}</div>}
      <button disabled={busy || meditation.hasAccess !== true || content.loading || Boolean(content.error)} onClick={access} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#274a3a] disabled:opacity-50">{busy ? "Preparing…" : link ? "Refresh meditation access" : "Get meditation access"}</button>
      {expired && <p role="status" className="text-sm">Access has expired. Refresh meditation access if playback stops.</p>}
      {link && kind === "AUDIO" && <audio key={link} aria-label={meditation.title} controls preload="metadata" src={link} onError={mediaError} className="w-full" />}
      {link && kind === "VIDEO" && <video key={link} aria-label={meditation.title} controls playsInline preload="metadata" src={link} onError={mediaError} className="w-full bg-black" />}
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold underline">Open meditation resource</a>}
    </div> : <>
      {items.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2">{items.map((item) => <Link
        key={item.id}
        href={`/profile/meditations/${encodeURIComponent(item.id)}`}
        aria-label={`Open ${item.title}`}
        className="group flex items-center gap-4 rounded-xl border border-[#dfe7dd] bg-white p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#b9cdbf] hover:shadow-[0_10px_24px_-14px_rgba(41,71,60,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a48] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eef2ea] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
          <RecordMedia record={item} compact imagesOnly />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-[Georgia,serif] text-base leading-snug">{item.title}</h2>
          <p className="mt-0.5 text-xs text-[#647368]">{item.contentType}{item.duration > 0 && ` · ${Math.max(1, Math.round(item.duration / 60))} min`}</p>
          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${item.hasAccess ? "bg-[#e6f0e8] text-[#315a48]" : "bg-[#f3ece8] text-[#8a4c3c]"}`}>{item.hasAccess ? "Available" : "Locked"}</span>
        </div>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-none stroke-current text-[#647368] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
      </Link>)}</div> : <p className="mt-8 rounded-xl bg-white p-6">No meditations are available in your account yet. <Link href="/meditations" className="underline">Browse meditations</Link></p>}
      <Pagination page={page} pagination={state.pagination} count={items.length} loading={state.loading} onChange={setPage} />
    </>)}
  </div></main>;
}