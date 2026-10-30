"use client";
/* eslint-disable @next/next/no-img-element -- Native previews preserve private cookie/range access and support local blob URLs. */
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { MEDIA_KINDS, MEDIA_ACCEPT, validateMediaFile, mediaAccessInfo, permanentMediaHref, publicMediaUrl } from "@/lib/dashboard/media";
import { useApi, rowsOf, idOf, labelOf } from "./data";
import { State, Pagination, Badge } from "./Elements";
import "./media.css";

export function MediaPreview({ record }) {
  const [href, setHref] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [expiresAt, setExpiresAt] = useState(0); const [expired, setExpired] = useState(false);
  const controller = useRef(null); const lock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setTimeout(() => { setHref(""); setExpired(true); setError("Preview access expired. Request fresh access to continue."); }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt]);
  async function access() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setHref(""); setExpired(false); setExpiresAt(0);
    const next = new AbortController(); controller.current = next;
    try {
      const id = idOf(record);
      const result = await accountFetch(`media/${encodeURIComponent(id)}/access-link`, { method: "POST", body: {}, signal: next.signal });
      if (!next.signal.aborted) { const grant = mediaAccessInfo(id, result); setHref(grant.href); setExpiresAt(grant.expiresAt); }
    } catch (caught) { if (!next.signal.aborted) setError(caught.message); }
    finally { lock.current = false; if (!next.signal.aborted) setBusy(false); }
  }
  const broken = () => { setHref(""); setExpired(true); setError("Preview unavailable or access expired. Request fresh access to try again."); };
  return <div className="ws-media-preview"><button type="button" className="ws-secondary" disabled={busy || record.status !== "ACTIVE"} onClick={access}>{busy ? "Requesting access..." : href ? "Refresh preview access" : expired ? "Renew preview access" : "Preview / download"}</button>
    {error && <p className="ws-alert" role="alert">{error}</p>}
    {href && <>
      {record.kind === "IMAGE" && record.mimeType?.startsWith("image/") && <img src={href} alt={record.altText || record.title || "Media preview"} referrerPolicy="no-referrer" onError={broken} />}
      {record.kind === "VIDEO" && record.mimeType?.startsWith("video/") && <video src={href} controls preload="metadata" onError={broken} />}
      {record.kind === "AUDIO" && record.mimeType?.startsWith("audio/") && <audio src={href} controls preload="metadata" onError={broken} />}
      <a className="ws-text-link" href={href} target="_blank" rel="noreferrer">Open {record.originalName || "file"}</a>
    </>}
  </div>;
}

export function MediaThumbnail({ record }) {
  const publicHref = permanentMediaHref(publicMediaUrl(record));
  const [href, setHref] = useState(publicHref);
  const [loading, setLoading] = useState(record?.kind === "IMAGE" && !publicHref && record?.status === "ACTIVE");
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setTimeout(() => { setHref(""); setError("Preview access expired"); }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    const id = idOf(record);
    const permanent = publicMediaUrl(record);
    const controller = new AbortController();
    let active = true;

    if (!id || record?.kind !== "IMAGE" || record?.status !== "ACTIVE") {
      return () => controller.abort();
    }

    if (permanent) {
      return () => controller.abort();
    }

    accountFetch(`media/${encodeURIComponent(id)}/access-link`, { method: "POST", body: {}, signal: controller.signal })
      .then(result => { if (active) { const grant = mediaAccessInfo(id, result); setHref(grant.href); setExpiresAt(grant.expiresAt); } })
      .catch(caught => { if (active && caught.name !== "AbortError") setError("Preview unavailable"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; controller.abort(); };
  }, [record]);

  if (href) return <img src={href} alt={record.altText || record.title || "Media thumbnail"} loading="lazy" referrerPolicy="no-referrer" onError={() => { setHref(""); setExpiresAt(0); setError("Preview unavailable"); }} />;
  return <div className="ws-media-thumb-placeholder"><span aria-hidden="true">{loading ? "…" : record?.kind === "IMAGE" ? "◌" : "·"}</span><small>{loading ? "Loading preview" : error || "No preview"}</small></div>;
}

export function MediaUpload({ initialKind = "IMAGE", fixedKind, onUploaded, onBusyChange }) {
  const [kind, setKind] = useState(fixedKind || initialKind); const [title, setTitle] = useState(""); const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(""); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const input = useRef(null); const lock = useRef(false); const controller = useRef(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Only local selected files own a blob URL, which is released on replacement.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);
  function choose(next) {
    setError(""); setNotice(""); setPreview(""); setProgress(0);
    try { validateMediaFile(next, kind); setFile(next); if (!title.trim()) setTitle(next.name); }
    catch (caught) { setFile(null); if (input.current) input.current.value = ""; setError(caught.message); }
  }
  async function upload() {
    if (lock.current) return;
    setError(""); setNotice("");
    try { validateMediaFile(file, kind); if (!title.trim()) throw new Error("Enter a media title."); }
    catch (caught) { setError(caught.message); return; }
    const body = new FormData(); body.set("file", file); body.set("title", title.trim());
    const next = new AbortController(); controller.current = next;
    lock.current = true; setBusy(true); setProgress(0); onBusyChange?.(true);
    try {
      const result = await accountFetch(`media/uploads/${kind}`, { method: "POST", body, signal: next.signal,
        onUploadProgress: ({ loaded, total }) => setProgress(total ? Math.min(99, Math.round(loaded / total * 100)) : null) });
      if (!idOf(result.data)) throw new Error("Upload response has no media ID. Refresh the library before uploading again.");
      setProgress(100); setNotice("Media uploaded successfully. It is available in the library.");
      setFile(null); setPreview(""); setTitle(""); if (input.current) input.current.value = "";
      await onUploaded?.(result.data);
    } catch (caught) { setError(caught.name === "AbortError" ? "Upload cancelled. Refresh the library before retrying; the server may already have received the file." : caught.message); }
    finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <div className="ws-media-upload"><h3>Upload media</h3><div className="ws-form">
    {!fixedKind && <label className="ws-field">Media type<select className="ws-input" disabled={busy} value={kind} onChange={event => { setKind(event.target.value); setFile(null); setPreview(""); setError(""); setNotice(""); if (input.current) input.current.value = ""; }}>{MEDIA_KINDS.map(value => <option key={value}>{value}</option>)}</select></label>}
    <label className="ws-field">Media title<input className="ws-input" disabled={busy} value={title} onChange={event => setTitle(event.target.value)} /></label>
    <label className="ws-field ws-field-full">File<input ref={input} className="ws-input" type="file" disabled={busy} accept={MEDIA_ACCEPT[kind]} onChange={event => choose(event.target.files?.[0])} /><small>{MEDIA_ACCEPT[kind]} · No client-side file size limit.</small></label>
    </div>
    {file && <div className="ws-media-preview"><p className="ws-muted">{file.name} · {(file.size / 1048576).toFixed(2)} MB</p>{preview && kind === "IMAGE" && <img src={preview} alt="Selected upload" />}{preview && kind === "VIDEO" && <video src={preview} controls preload="metadata" />}{preview && kind === "AUDIO" && <audio src={preview} controls preload="metadata" />}{!busy && <button type="button" className="ws-text-link" onClick={() => { setFile(null); setPreview(""); if (input.current) input.current.value = ""; }}>Remove selected file</button>}</div>}
    {error && <p role="alert" className="ws-alert">{error}</p>}{notice && <p role="status" className="ws-notice">{notice}</p>}
    {(busy || progress === 100) && <div><progress aria-label="Media upload progress" max="100" value={progress ?? undefined} /><p role="status" className="ws-muted">{progress === 100 ? "Upload complete" : progress === 99 ? "File sent; waiting for the service to finish..." : progress == null ? "Uploading..." : `Uploading: ${progress}%`}</p></div>}
    <div className="ws-toolbar-actions"><button type="button" className="ws-button" disabled={busy || !file || !title.trim()} onClick={upload}>{busy ? "Uploading..." : "Upload file"}</button>{busy && <button type="button" className="ws-secondary" onClick={() => controller.current?.abort()}>Cancel upload</button>}</div>
  </div>;
}

export function MediaBrowser({ onSelect, onBusyChange, compact = false, kinds = ["IMAGE"], allowNonPublic = false }) {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const state = useApi(`media?page=${page}&limit=20`);
  const rows = rowsOf(state.data, ["media", "files"]);
  const [detail, setDetail] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(!compact);
  const lock = useRef(false); const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function inspect(item, select = false, publish = false) {
    if (lock.current || uploading) return;
    lock.current = true; setBusy(true); setError(""); onBusyChange?.(true);
    const next = new AbortController(); controller.current = next;
    let selected;
    try {
      const path = `media/${encodeURIComponent(idOf(item))}`;
      let result = await accountFetch(path, { signal: next.signal });
      if (next.signal.aborted) return;
      if (publish) {
        const latest = result.data;
        if (latest?.kind !== "IMAGE" || latest.status !== "ACTIVE" || !Number.isSafeInteger(latest.version)) throw new Error("This image is unavailable. Refresh the library and try again.");
        result = await accountFetch(path, { method: "PATCH", body: { version: latest.version, title: latest.title, visibility: "PUBLIC" }, signal: next.signal });
        if (next.signal.aborted) return;
        setDetail(result.data);
      }
      if (select) {
        if (!idOf(result.data) || !kinds.includes(result.data.kind) || (allowNonPublic ? result.data.status !== "ACTIVE" : !publicMediaUrl(result.data))) {
          throw new Error(allowNonPublic ? "This media is no longer active. Refresh the library and try again." : "This media is no longer available as a public file.");
        }
        selected = result.data;
      }
      else setDetail(result.data);
    } catch (caught) { if (!next.signal.aborted) setError(caught.message); }
    finally { lock.current = false; if (!next.signal.aborted) { setBusy(false); onBusyChange?.(false); } }
    if (selected) onSelect(selected);
  }
  const shown = rows.filter(item => kinds.includes(item.kind) && `${item.title || ""} ${item.originalName || ""}`.toLowerCase().includes(search.toLowerCase()));
  const singleKind = kinds.length === 1 ? kinds[0] : "MEDIA";
  const kindLabel = singleKind === "MEDIA" ? "media" : singleKind.toLowerCase();
  const detailSelectable = detail && kinds.includes(detail.kind) && (allowNonPublic ? detail.status === "ACTIVE" : Boolean(publicMediaUrl(detail)));
  return <div className={`ws-detail-stack ws-media-browser ${compact ? "is-compact" : ""}`}><div className="ws-media-browser-note"><strong>Choose {kindLabel}</strong><span>Select an existing {kindLabel} from your media library.</span></div>{compact && kinds.length === 1 && kinds[0] === "IMAGE" && <button type="button" className="ws-secondary ws-media-upload-toggle" disabled={busy || uploading} onClick={() => setUploadOpen(current => !current)}>{uploadOpen ? "Close upload" : "+ Upload new image"}</button>}{compact && kinds.length === 1 && kinds[0] === "IMAGE" && uploadOpen && <MediaUpload fixedKind="IMAGE" onBusyChange={next => { setUploading(next); onBusyChange?.(next); }} onUploaded={async record => { setDetail(record); setUploadOpen(false); await state.reload(); }} />}
    <div className="ws-toolbar"><input aria-label={`Search ${kindLabel} library`} placeholder={`Search your ${kindLabel} library...`} value={search} onChange={event => setSearch(event.target.value)} /><button type="button" className="ws-secondary" disabled={state.loading || busy} onClick={state.reload}>Refresh library</button></div>
    <State {...state} retry={state.reload} />{error && <p className="ws-alert" role="alert">{error}</p>}{busy && <p role="status">Loading media details...</p>}
    {!state.loading && !state.error && <><State empty={!shown.length} title={`No matching ${kindLabel}`} description={`No ${kindLabel} files match this search.`} /><ul className="ws-list ws-media-list ws-media-grid">{shown.map(item => { const selectable = allowNonPublic ? item.status === "ACTIVE" : Boolean(publicMediaUrl(item)); return <li key={idOf(item)} className="ws-media-card"><div className="ws-media-card-art">{item.kind === "IMAGE" ? <MediaThumbnail key={`${idOf(item)}:${item.version || ""}`} record={item} /> : <div className="ws-media-thumb-placeholder"><span>{item.kind}</span><small>{item.originalName || "File"}</small></div>}</div><div className="ws-media-card-body"><div className="ws-media-card-heading"><div><span className="ws-media-card-kicker">{item.kind}</span><h3>{labelOf(item)}</h3></div><Badge status={item.status} /></div><p>{item.originalName || "Untitled file"}</p><div className="ws-media-card-meta"><Badge status={item.visibility} /><span>{(Number(item.size || 0) / 1048576).toFixed(2)} MB</span></div><div className="ws-media-card-actions"><button type="button" className="ws-secondary" disabled={busy} onClick={() => inspect(item)}>View media</button><button type="button" className="ws-button" disabled={busy || !selectable} title={selectable ? `Use this ${kindLabel}` : allowNonPublic ? "Only active media can be used" : "Only active public media can be used"} onClick={() => inspect(item, true)}>{selectable ? `Use ${kindLabel}` : "Unavailable"}</button></div></div></li>; })}</ul><Pagination page={page} count={rows.length} pagination={state.pagination} loading={state.loading || busy} onChange={next => { setDetail(null); setPage(next); }} /></>}
    {detail && <section className="ws-media-detail"><div className="ws-media-detail-heading"><div><span className="ws-media-card-kicker">{detail.kind || "MEDIA"} DETAILS</span><h3>{labelOf(detail)}</h3><p className="ws-muted">{detail.originalName} · {detail.mimeType} · {detail.visibility}</p></div><Badge status={detail.status} /></div><MediaPreview key={`${idOf(detail)}:${detail.version}`} record={detail} /><button type="button" className="ws-button" disabled={busy || uploading || !detailSelectable} onClick={() => inspect(detail, true)}>Select {kindLabel}</button>{!detailSelectable && <p className="ws-muted">{allowNonPublic ? `Only active ${kindLabel} files can be selected.` : `Only active public ${kindLabel} files can be selected.`}</p>}{!allowNonPublic && detail.kind === "IMAGE" && detail.status === "ACTIVE" && detail.visibility === "PRIVATE" && <button type="button" className="ws-secondary" disabled={busy || uploading} onClick={() => inspect(detail, true, true)}>Make public &amp; select image</button>}</section>}
  </div>;
}

export function PermanentImagePreview({ value }) {
  const [broken, setBroken] = useState(false); const href = permanentMediaHref(value);
  return <div className="ws-media-preview">{href && !broken ? <img src={href} alt="Saved image" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : <p className="ws-muted">{broken ? "Image could not load. Check the saved URL." : "Saved value has no permanent preview URL."}</p>}<p className="ws-muted ws-media-path">{value}</p></div>;
}

