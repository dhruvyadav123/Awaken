"use client";
/* eslint-disable @next/next/no-img-element -- Native previews preserve private cookie/range access and support local blob URLs. */
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { MEDIA_KINDS, MEDIA_ACCEPT, MEDIA_MAX_BYTES, validateMediaFile, mediaFileHref, publicMediaUrl, safePermanentMediaUrl } from "@/lib/dashboard/media";
import { useApi, rowsOf, idOf, labelOf } from "./data";
import { State, Pagination, Badge } from "./Elements";
import "./media.css";

export function MediaPreview({ record }) {
  const [href, setHref] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const controller = useRef(null); const lock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function access() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setHref("");
    const next = new AbortController(); controller.current = next;
    try {
      const id = idOf(record);
      const result = await accountFetch(`media/${encodeURIComponent(id)}/access-link`, { method: "POST", body: {}, signal: next.signal });
      if (!next.signal.aborted) setHref(mediaFileHref(id, result));
    } catch (caught) { if (!next.signal.aborted) setError(caught.message); }
    finally { lock.current = false; if (!next.signal.aborted) setBusy(false); }
  }
  const broken = () => { setHref(""); setError("Preview unavailable or access expired. Request fresh access to try again."); };
  return <div className="ws-media-preview"><button type="button" className="ws-secondary" disabled={busy || record.status !== "ACTIVE"} onClick={access}>{busy ? "Requesting access..." : href ? "Refresh preview access" : "Preview / download"}</button>
    {error && <p className="ws-alert" role="alert">{error}</p>}
    {href && <>
      {record.kind === "IMAGE" && record.mimeType?.startsWith("image/") && <img src={href} alt={record.altText || record.title || "Media preview"} referrerPolicy="no-referrer" onError={broken} />}
      {record.kind === "VIDEO" && record.mimeType?.startsWith("video/") && <video src={href} controls preload="metadata" onError={broken} />}
      {record.kind === "AUDIO" && record.mimeType?.startsWith("audio/") && <audio src={href} controls preload="metadata" onError={broken} />}
      <a className="ws-text-link" href={href} target="_blank" rel="noreferrer">Open {record.originalName || "file"}</a>
    </>}
  </div>;
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
    <label className="ws-field ws-field-full">File<input ref={input} className="ws-input" type="file" disabled={busy} accept={MEDIA_ACCEPT[kind]} onChange={event => choose(event.target.files?.[0])} /><small>{MEDIA_ACCEPT[kind]} · Client limit: {Math.round(MEDIA_MAX_BYTES / 1048576 * 10) / 10} MB. Backend file restrictions also apply.</small></label>
    </div>
    {file && <div className="ws-media-preview"><p className="ws-muted">{file.name} · {(file.size / 1048576).toFixed(2)} MB</p>{preview && kind === "IMAGE" && <img src={preview} alt="Selected upload" />}{preview && kind === "VIDEO" && <video src={preview} controls preload="metadata" />}{preview && kind === "AUDIO" && <audio src={preview} controls preload="metadata" />}{!busy && <button type="button" className="ws-text-link" onClick={() => { setFile(null); setPreview(""); if (input.current) input.current.value = ""; }}>Remove selected file</button>}</div>}
    {error && <p role="alert" className="ws-alert">{error}</p>}{notice && <p role="status" className="ws-notice">{notice}</p>}
    {(busy || progress === 100) && <div><progress aria-label="Media upload progress" max="100" value={progress ?? undefined} /><p role="status" className="ws-muted">{progress === 100 ? "Upload complete" : progress === 99 ? "File sent; waiting for the service to finish..." : progress == null ? "Uploading..." : `Uploading: ${progress}%`}</p></div>}
    <div className="ws-toolbar-actions"><button type="button" className="ws-button" disabled={busy || !file || !title.trim()} onClick={upload}>{busy ? "Uploading..." : "Upload file"}</button>{busy && <button type="button" className="ws-secondary" onClick={() => controller.current?.abort()}>Cancel upload</button>}</div>
  </div>;
}

export function MediaBrowser({ onSelect, onBusyChange }) {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const state = useApi(`media?page=${page}&limit=20`);
  const rows = rowsOf(state.data, ["media", "files"]);
  const [detail, setDetail] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lock = useRef(false); const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function inspect(item, select = false) {
    if (lock.current || uploading) return;
    lock.current = true; setBusy(true); setError("");
    const next = new AbortController(); controller.current = next;
    try {
      const result = await accountFetch(`media/${encodeURIComponent(idOf(item))}`, { signal: next.signal });
      if (next.signal.aborted) return;
      if (select) { if (!publicMediaUrl(result.data)) throw new Error("This media is no longer available as a public image."); onSelect(result.data); }
      else setDetail(result.data);
    } catch (caught) { if (!next.signal.aborted) setError(caught.message); }
    finally { lock.current = false; if (!next.signal.aborted) setBusy(false); }
  }
  const shown = rows.filter(item => item.kind === "IMAGE" && `${item.title || ""} ${item.originalName || ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="ws-detail-stack"><p className="ws-muted">Only public images can be selected here. Uploaded private images remain in your library.</p><MediaUpload fixedKind="IMAGE" onBusyChange={next => { setUploading(next); onBusyChange?.(next); }} onUploaded={async () => { setDetail(null); await state.reload(); }} />
    <div className="ws-toolbar"><input aria-label="Search media on this page" placeholder="Search this page..." value={search} onChange={event => setSearch(event.target.value)} /><button type="button" className="ws-secondary" disabled={state.loading || busy} onClick={state.reload}>Refresh library</button></div>
    <State {...state} retry={state.reload} />{error && <p className="ws-alert" role="alert">{error}</p>}{busy && <p role="status">Loading media details...</p>}
    {!state.loading && !state.error && <><State empty={!shown.length} title="No matching images" description="Try another page, or upload an image." /><ul className="ws-list ws-media-list">{shown.map(item => <li key={idOf(item)}><div className="ws-list-content"><h3>{labelOf(item)}</h3><p>{item.originalName}</p><Badge status={item.visibility} /> <Badge status={item.status} /></div><button type="button" className="ws-secondary" disabled={busy} onClick={() => inspect(item)}>View media</button></li>)}</ul><Pagination page={page} count={rows.length} pagination={state.pagination} loading={state.loading || busy} onChange={next => { setDetail(null); setPage(next); }} /></>}
    {detail && <section className="ws-media-detail"><h3>{labelOf(detail)}</h3><p className="ws-muted">{detail.originalName} · {detail.mimeType} · {detail.visibility}</p><MediaPreview key={`${idOf(detail)}:${detail.version}`} record={detail} /><button type="button" className="ws-button" disabled={busy || !publicMediaUrl(detail)} onClick={() => inspect(detail, true)}>Select image</button>{!publicMediaUrl(detail) && <p className="ws-muted">This image is private or unavailable for public use. Choose an active public image.</p>}</section>}
  </div>;
}

export function PermanentImagePreview({ value }) {
  const [broken, setBroken] = useState(false); const href = safePermanentMediaUrl(value);
  return <div className="ws-media-preview">{href && !broken ? <img src={href} alt="Saved image" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : <p className="ws-muted">{broken ? "Image could not load. Check the saved URL." : "Saved value has no permanent preview URL."}</p>}<p className="ws-muted ws-media-path">{value}</p></div>;
}

export function MediaField({ title, value, multiple, onChange, onBusyChange }) {
  const [open, setOpen] = useState(false); const [uploading, setUploading] = useState(false);
  const values = multiple ? Array.isArray(value) ? value : [] : value ? [value] : [];
  function select(record) { const href = publicMediaUrl(record); if (!href) return; onChange(multiple ? [...new Set([...values, href])] : href); setOpen(false); }
  function uploadingChanged(next) { setUploading(next); onBusyChange?.(next); }
  return <fieldset className="ws-field-full"><legend>{title}</legend><div className="ws-media-selections">{values.map((url, index) => <div key={`${url}:${index}`}><PermanentImagePreview key={url} value={url} /><button type="button" disabled={uploading} className="ws-text-link" onClick={() => onChange(multiple ? values.filter((_, i) => i !== index) : "")}>Remove selection</button></div>)}</div>
    <label className="ws-field">{multiple ? "Existing image URLs (one per line)" : "Existing image URL"}{multiple ? <textarea className="ws-input" disabled={uploading} value={values.join("\n")} onChange={event => onChange(event.target.value.split("\n").filter(Boolean))} /> : <input className="ws-input" type="text" inputMode="url" disabled={uploading} value={value || ""} onChange={event => onChange(event.target.value)} />}</label>
    <button type="button" className="ws-secondary" disabled={uploading} onClick={() => setOpen(current => !current)}>{open ? "Hide library" : values.length && !multiple ? "Replace / upload image" : "Select / upload image"}</button>
    {open && <MediaBrowser onSelect={select} onBusyChange={uploadingChanged} />}
    <p className="ws-muted">Save the form to apply your selection. Removing a selection keeps the original file in the library.</p>
  </fieldset>;
}
