"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { externalUrl } from "@/lib/learning-data";
import { meditationRequiresMembership, publicMeditationPlayback } from "@/lib/meditation-display";

function Player({ kind, source, title, onError }) {
  const hosted = /(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(source);
  if (hosted) return <a href={source} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#315a48] underline">Watch video ↗</a>;
  if (kind === "VIDEO") return <video controls playsInline preload="metadata" src={source} aria-label={title} onError={onError} className="aspect-video w-full rounded-lg bg-black" />;
  return <audio controls preload="metadata" src={source} aria-label={title} onError={onError} className="w-full" />;
}

export default function MeditationPlayer({ meditation, compact = false }) {
  const title = meditation?.title || meditation?.name || "Meditation";
  const id = meditation?.id || meditation?._id;
  const publicAsset = publicMeditationPlayback(meditation);
  const [source, setSource] = useState(publicAsset?.source || "");
  const [kind, setKind] = useState(publicAsset?.kind || String(meditation?.contentType || "").toUpperCase());
  const [text, setText] = useState("");
  const [status, setStatus] = useState(publicAsset ? "ready" : "idle");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setTimeout(() => setStatus("expired"), Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  async function prepare() {
    if (!id || lock.current || publicAsset) return;
    lock.current = true;
    setStatus("loading");
    setError("");
    setErrorStatus(null);
    setSource("");
    setText("");
    try {
      const detailResult = await accountFetch(`me/meditations/${encodeURIComponent(id)}`);
      const privateMeditation = detailResult.data?.meditation || detailResult.data;
      if (privateMeditation?.hasAccess !== true) {
        setStatus("locked");
        return;
      }
      const contentResult = await accountFetch(`me/meditations/${encodeURIComponent(id)}/content`);
      const content = contentResult.data || {};
      const contentKind = String(content.contentType || privateMeditation.contentType || meditation?.contentType || "").toUpperCase();
      const written = typeof content === "string" ? content : content.content || content.body || content.text || content.script || "";
      setKind(contentKind);
      if (written && !["AUDIO", "VIDEO"].includes(contentKind)) {
        setText(written);
        setStatus("ready");
        return;
      }
      const accessResult = await accountFetch(`me/meditations/${encodeURIComponent(id)}/access-link`, { method: "POST", body: {} });
      const nextSource = externalUrl(accessResult.data);
      if (!nextSource) throw new Error("Meditation playback is unavailable right now.");
      setSource(nextSource);
      setExpiresAt(accessResult.data?.expiresIn > 0 ? Date.now() + accessResult.data.expiresIn * 1000 : 0);
      setStatus("ready");
    } catch (caught) {
      if ([403, 404].includes(caught.status)) {
        setStatus("locked");
        return;
      }
      setError(caught.message);
      setErrorStatus(caught.status || null);
      setStatus("error");
    } finally {
      lock.current = false;
    }
  }

  function playbackError() {
    setSource("");
    setStatus("expired");
    setError("Playback stopped or the secure link expired. Request fresh access to continue.");
  }

  if (publicAsset) return <div className={compact ? "mt-2" : "mt-8"}><Player kind={publicAsset.kind} source={publicAsset.source} title={title} onError={playbackError} /></div>;
  if (!id) return <p className={compact ? "mt-5 border-t border-[#e4e9e1] pt-5 text-xs leading-5 text-[#647368]" : "mt-8 text-sm text-[#647368]"}>Open the meditation details to check playback availability.</p>;

  return <div className={compact ? "mt-5 border-t border-[#e4e9e1] pt-5" : "mt-8 rounded-xl border border-[#dfe7dd] bg-white p-5 sm:p-6"}>
    {/* {status === "idle" && <button type="button" onClick={prepare} className="inline-flex min-h-10 items-center rounded-md bg-[#315a48] px-4 text-xs font-semibold text-white">Play meditation</button>} */}
    {status === "loading" && <p role="status" className="text-sm text-[#647368]">Preparing your meditation…</p>}
    {status === "locked" && <p role="status" className="text-sm leading-6 text-[#647368]">This meditation is not currently available in your account. <Link href="/infinity/membership" className="font-semibold text-[#315a48] underline">Check membership options</Link>.</p>}
    {status === "ready" && text && <div className="whitespace-pre-line text-sm leading-7 text-[#43534a]">{text}</div>}
    {status === "ready" && source && <Player kind={kind} source={source} title={title} onError={playbackError} />}
    {status === "expired" && <><p role="status" className="text-sm text-[#8a4c3c]">{error || "Your secure playback link has expired."}</p><button type="button" onClick={prepare} className="mt-3 text-sm font-semibold text-[#315a48] underline">Refresh access</button></>}
    {status === "error" && <div role="alert" className="text-sm leading-6 text-[#8a4c3c]"><p>{error}</p>{errorStatus === 401 ? <Link href={`/auth/login?next=${encodeURIComponent("/meditations")}`} className="mt-2 inline-block font-semibold underline">Sign in to continue</Link> : <button type="button" onClick={prepare} className="mt-2 font-semibold underline">Try again</button>}</div>}
  </div>;
}
