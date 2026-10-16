"use client";
/* eslint-disable @next/next/no-img-element -- Backend/private image URLs use native previews without forwarding cookies through an image optimizer. */
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { recordMedia, recordFields } from "@/lib/record-display";
import { mediaFileHref } from "@/lib/dashboard/media";
import "./api-record-display.css";

function MediaAsset({ asset, scope, compact }) {
  const initial = asset.source || (asset.id && !asset.protected ? `/api/public/files/media/${encodeURIComponent(asset.id)}/file` : "");
  const [source, setSource] = useState(initial); const [kind, setKind] = useState(asset.kind);
  const [loading, setLoading] = useState(asset.kind === "IMAGE" && (asset.protected || Boolean(initial))); const [error, setError] = useState("");
  const controller = useRef(null); const lock = useRef(false);
  async function load(signal) {
    if (lock.current) return;
    lock.current = true; setLoading(true); setError("");
    try {
      const id = encodeURIComponent(asset.id);
      const metadata = (await accountFetch(`media/${id}`, { signal })).data;
      if (!metadata || metadata.status !== "ACTIVE") throw new Error("This file is currently unavailable.");
      const grant = await accountFetch(`media/${id}/access-link`, { method: "POST", body: {}, signal });
      if (!signal?.aborted) { setKind(metadata.kind || asset.kind); setSource(mediaFileHref(asset.id, grant)); }
    } catch (caught) { if (!signal?.aborted) { setSource(""); setError(caught.message); } }
    finally { lock.current = false; if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    if (!asset.protected || asset.kind !== "IMAGE" || scope !== "facilitator") return;
    const next = new AbortController(); controller.current = next;
    const timer = setTimeout(() => void load(next.signal), 0);
    return () => { clearTimeout(timer); next.abort(); };
    // Asset identity is keyed by the parent, so the captured reference remains stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => controller.current?.abort(), []);
  const failed = () => { setLoading(false); setSource(""); setError("This preview could not load. Try again or refresh the page."); };
  function retry() {
    if (asset.protected) { const next = new AbortController(); controller.current?.abort(); controller.current = next; void load(next.signal); }
    else { setError(""); setLoading(asset.kind === "IMAGE"); setSource(initial); }
  }
  const hostedVideo = source && /(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(source);
  return <figure className={`api-media-asset ${compact ? "is-compact" : ""}`}>
    {loading && <p className="api-media-loading" role="status">Loading {kind.toLowerCase()}...</p>}
    {source && kind === "IMAGE" && <img src={source} alt={asset.alt} loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoading(false)} onError={failed} />}
    {source && kind === "VIDEO" && !hostedVideo && <video src={source} controls playsInline preload="metadata" aria-label={asset.title} onError={failed} />}
    {source && kind === "AUDIO" && <audio src={source} controls preload="metadata" aria-label={asset.title} onError={failed} />}
    {source && (kind === "DOCUMENT" || hostedVideo) && <a href={source} target="_blank" rel="noreferrer" className="api-media-link">{hostedVideo ? "Watch video" : "Open document"}: {asset.title}</a>}
    {asset.protected && scope === "facilitator" && <button type="button" disabled={loading} className="api-media-link" onClick={retry}>{loading ? "Requesting access..." : source ? "Refresh file access" : "Load file preview"}</button>}
    {error && <div className="api-media-error" role="alert"><p>{error}</p><button type="button" disabled={loading} onClick={retry}>Retry preview</button></div>}
    {!compact && <figcaption>{asset.title}</figcaption>}
  </figure>;
}
export function RecordMedia({ record, scope = "public", compact = false, imagesOnly = false }) {
  const assets = recordMedia(record, { scope, imagesOnly });
  const shown = compact ? assets.slice(0, 1) : assets;
  if (!shown.length) return null;
  return <div className={`api-media-gallery ${compact ? "is-compact" : ""}`} aria-label="Resource media">{shown.map(asset => <MediaAsset key={`${asset.key}:${asset.kind}:${scope}:${asset.source}:${record?.version || ""}`} asset={asset} scope={scope} compact={compact} />)}</div>;
}
export function RecordDetails({ record, exclude = [], publicView = false, title = "More details" }) {
  const fields = recordFields(record, { exclude, publicView });
  if (!fields.length) return null;
  return <details className="api-record-details"><summary>{title}</summary><dl>{fields.map(field => {
    let value = typeof field.value === "boolean" ? field.value ? "Yes" : "No" : typeof field.value === "number" ? field.value.toLocaleString("en-IN") : field.value;
    if (/(?:At|Date)$/.test(field.key) && typeof field.value === "string" && Number.isFinite(Date.parse(field.value))) value = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(field.value));
    return <div key={field.key}><dt>{field.label}</dt><dd>{value}</dd></div>;
  })}</dl></details>;
}
