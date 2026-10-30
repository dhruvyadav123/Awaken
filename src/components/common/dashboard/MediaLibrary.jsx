"use client";

import { useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { useApi, rowsOf, idOf, labelOf, date } from "./data";
import { State, Card, Pagination, Badge } from "./Elements";
import { MEDIA_KINDS } from "@/lib/dashboard/media";
import { operationFor } from "@/lib/dashboard/operations";
import MutationDialog from "./MutationDialog";
import { Icon } from "./WorkspaceShell";
import { MediaPreview, MediaThumbnail, MediaUpload } from "./MediaControls";

const kindNames = { IMAGE: "Image", VIDEO: "Video", AUDIO: "Audio", DOCUMENT: "Document" };
const kindIcons = { VIDEO: "▶", AUDIO: "♫", DOCUMENT: "PDF" };
const tabs = [{ value: "", label: "All" }, ...MEDIA_KINDS.map(value => ({ value, label: kindNames[value] }))];

function shortDate(value) {
  const formatted = date(value);
  return formatted === "—" ? formatted : formatted.split(",")[0];
}

function mediaSize(item) {
  const bytes = Number(item.size || item.sizeBytes || 0);
  return bytes ? `${(bytes / 1048576).toFixed(1)} MB` : "—";
}

export default function MediaLibrary() {
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const state = useApi(`media?page=${page}&limit=20`);
  const [selected, setSelected] = useState("");
  const detail = useApi(selected ? `media/${encodeURIComponent(selected)}` : null);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [working, setWorking] = useState(false);
  const lock = useRef(false);
  const record = idOf(detail.data) === selected ? detail.data : null;
  const rows = rowsOf(state.data, ["media", "files"]);
  const shown = rows.filter(item => (!kind || item.kind === kind) && `${item.title || ""} ${item.originalName || ""}`.toLowerCase().includes(search.toLowerCase()));

  async function updated() {
    await Promise.all([state.reload(), detail.reload()]);
  }

  async function open(item, method) {
    if (lock.current) return;
    lock.current = true;
    setWorking(true);
    setError("");
    try {
      const id = idOf(item);
      const latest = (await accountFetch(`media/${encodeURIComponent(id)}`)).data;
      if (!latest || latest.version == null) throw new Error("The latest media version is unavailable. Refresh the library.");
      setModal({ operation: operationFor(method, "media/{{mediaId}}"), path: `media/${encodeURIComponent(id)}`, detailPath: `media/${encodeURIComponent(id)}`, current: latest, title: method === "DELETE" ? "Delete media" : "Update media" });
    } catch (caught) {
      setError(caught.message);
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  return <div className="ws-detail-stack ws-media-library-page ws-media-reference-page">
    <section className="ws-media-reference-toolbar" aria-label="Media library controls">
      <div className="ws-media-reference-tabs" role="tablist" aria-label="Filter media by type">
        {tabs.map(tab => <button key={tab.value || "all"} type="button" role="tab" aria-selected={kind === tab.value} className={kind === tab.value ? "is-active" : ""} onClick={() => { setKind(tab.value); setPage(1); }}><span>{tab.label}</span><small>{tab.value ? rows.filter(item => item.kind === tab.value).length : rows.length}</small></button>)}
      </div>
      <div className="ws-media-reference-actions">
        <label className="ws-media-reference-search"><Icon name="search" size={15} /><span className="ws-sr-only">Search media</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search media..." /></label>
        <button type="button" className="ws-button ws-media-upload-button" onClick={() => setUploadOpen(current => !current)}>{uploadOpen ? "Close upload" : "+ Upload media"}</button>
      </div>
    </section>

    {uploadOpen && <section className="ws-media-reference-upload"><MediaUpload onBusyChange={setUploading} onUploaded={async uploaded => { setSelected(idOf(uploaded)); setUploadOpen(false); await state.reload(); }} /></section>}
    {error && <p className="ws-alert" role="alert">{error}</p>}{notice && <p className="ws-notice" role="status">{notice}</p>}
    <State {...state} retry={state.reload} />
    {!state.loading && !state.error && <>
      <State empty={!shown.length} title="No matching media" description={rows.length ? "Try another filter or search term." : "Uploaded files will appear here."} />
      {!!shown.length && <ul className="ws-media-reference-grid">
        {shown.map(item => <li key={idOf(item)} className="ws-media-reference-card">
          <div className={`ws-media-reference-art ${item.kind === "IMAGE" ? "is-image" : `is-${String(item.kind || "file").toLowerCase()}`}`}>
            {item.kind === "IMAGE" ? <MediaThumbnail key={`${idOf(item)}:${item.version || ""}`} record={item} /> : <div className="ws-media-reference-file-icon"><span>{kindIcons[item.kind] || "•"}</span></div>}
            <span className="ws-media-reference-type">{kindNames[item.kind] || item.kind || "File"}</span>
            <button type="button" className="ws-media-reference-add" aria-label={`Open ${labelOf(item)} details`} onClick={() => setSelected(idOf(item))}>+</button>
            {item.kind === "VIDEO" && <span className="ws-media-reference-play" aria-hidden="true">▶</span>}
          </div>
          <div className="ws-media-reference-card-body">
            <div className="ws-media-reference-heading"><div><h3 title={labelOf(item)}>{labelOf(item)}</h3><p title={item.originalName || "Untitled file"}>{item.originalName || "Untitled file"}</p></div><button type="button" className="ws-media-reference-more" aria-label={`Open ${labelOf(item)} details`} onClick={() => setSelected(idOf(item))}>⋮</button></div>
            <div className="ws-media-reference-meta"><span><Icon name="calendar" size={12} />{shortDate(item.createdAt || item.uploadedAt || item.updatedAt)}</span><span>{mediaSize(item)}</span></div>
            <div className="ws-media-reference-status"><span className={`ws-media-reference-visibility is-${String(item.visibility || "private").toLowerCase()}`}><i />{String(item.visibility || "Private").replaceAll("_", " ")}</span><Badge status={item.status} /></div>
            <div className="ws-media-reference-card-actions"><button type="button" className="ws-secondary" disabled={working} onClick={() => setSelected(idOf(item))}>View media</button><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(item, "PATCH")}>Edit</button></div>
          </div>
        </li>)}
      </ul>}
      <Pagination page={page} count={rows.length} pagination={state.pagination} onChange={next => { setSelected(""); setPage(next); }} loading={state.loading || working} />
    </>}

    {selected && <Card title="Media details"><State {...detail} retry={detail.reload} />{!detail.loading && !detail.error && record && <><h3>{labelOf(record)}</h3><dl className="ws-review"><div><dt>Type</dt><dd>{kindNames[record.kind] || record.kind || "Unavailable"}</dd></div><div><dt>File name</dt><dd>{record.originalName || "Unavailable"}</dd></div><div><dt>Format</dt><dd>{record.mimeType || "Unavailable"}</dd></div><div><dt>Size</dt><dd>{mediaSize(record)}</dd></div><div><dt>Visibility</dt><dd>{record.visibility || "Unavailable"}</dd></div><div><dt>Status</dt><dd>{record.status || "Unavailable"}</dd></div><div><dt>Version</dt><dd>{record.version ?? "Unavailable"}</dd></div><div><dt>Updated</dt><dd>{date(record.updatedAt)}</dd></div></dl><MediaPreview key={`${idOf(record)}:${record.version}`} record={record} /><div className="ws-toolbar-actions"><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(record, "PATCH")}>Update media</button><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(record, "DELETE")}>Delete</button><button type="button" className="ws-secondary" onClick={() => setSelected("")}>Close details</button></div></>}</Card>}
    {modal && <MutationDialog {...modal} choices={modal.operation.method === "PATCH" ? { visibility: modal.current?.kind === "IMAGE" ? ["PUBLIC", "PRIVATE"] : ["PRIVATE"] } : {}} description={modal.operation.method === "DELETE" ? "Delete this media? Other records may reuse it. To replace a form selection, remove its reference in that form instead. The backend decides whether deletion is allowed." : modal.current?.kind === "IMAGE" ? "Update the image title or public visibility. The latest version is loaded before saving." : "Update the media title. Video, audio and document files remain private and use protected access."} submitLabel={modal.operation.method === "PATCH" ? "Update media" : undefined} onClose={() => setModal(null)} onSuccess={async () => { if (modal.operation.method === "DELETE") { if (idOf(modal.current) === selected) setSelected(""); setNotice("Media deleted."); await state.reload(); if (page > 1 && rows.length === 1) setPage(page - 1); } else { setNotice("Media updated successfully."); await updated(); } }} />}
  </div>;
}
