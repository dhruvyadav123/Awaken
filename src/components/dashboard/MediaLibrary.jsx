"use client";
import { useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { useApi, rowsOf, idOf, labelOf, date } from "./data";
import { State, Card, Pagination, Badge } from "./Elements";
import { MEDIA_KINDS } from "@/lib/dashboard/media";
import { operationFor } from "@/lib/dashboard/operations";
import MutationDialog from "./MutationDialog";
import { MediaPreview, MediaUpload } from "./MediaControls";

export default function MediaLibrary() {
  const [page, setPage] = useState(1); const [kind, setKind] = useState(""); const [search, setSearch] = useState("");
  const state = useApi(`media?page=${page}&limit=20`); const [selected, setSelected] = useState("");
  const detail = useApi(selected ? `media/${encodeURIComponent(selected)}` : null);
  const [modal, setModal] = useState(null); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false); const [working, setWorking] = useState(false); const lock = useRef(false);
  const record = idOf(detail.data) === selected ? detail.data : null; const rows = rowsOf(state.data, ["media", "files"]);
  const shown = rows.filter(item => (!kind || item.kind === kind) && `${item.title || ""} ${item.originalName || ""}`.toLowerCase().includes(search.toLowerCase()));
  async function updated() { await Promise.all([state.reload(), detail.reload()]); }
  async function open(item, method) {
    if (lock.current) return;
    lock.current = true; setWorking(true); setError("");
    try {
      const id = idOf(item); const latest = (await accountFetch(`media/${encodeURIComponent(id)}`)).data;
      if (!latest || latest.version == null) throw new Error("The latest media version is unavailable. Refresh the library.");
      setModal({ operation: operationFor(method, "media/{{mediaId}}"), path: `media/${encodeURIComponent(id)}`, detailPath: `media/${encodeURIComponent(id)}`, current: latest, title: method === "DELETE" ? "Delete media" : "Edit media title" });
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }
  return <div className="ws-detail-stack">
    <Card title="Teaching media library"><p className="ws-muted">Upload once and reuse your files. Private files require authorized preview access.</p><MediaUpload onBusyChange={setUploading} onUploaded={async uploaded => { setSelected(idOf(uploaded)); await state.reload(); }} /></Card>
    <Card title="Your uploaded media">
      {error && <p className="ws-alert" role="alert">{error}</p>}{notice && <p className="ws-notice" role="status">{notice}</p>}
      <div className="ws-toolbar"><input aria-label="Search media on this page" placeholder="Search this page..." value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter media type" value={kind} onChange={event => setKind(event.target.value)}><option value="">All media types</option>{MEDIA_KINDS.map(value => <option key={value}>{value}</option>)}</select><button type="button" className="ws-secondary" disabled={state.loading || working} onClick={updated}>Refresh library</button></div>
      <State {...state} retry={state.reload} />
      {!state.loading && !state.error && <><State empty={!shown.length} title="No matching media" description={rows.length ? "Try another filter or page." : "Uploaded files will appear here."} /><ul className="ws-list ws-media-list">{shown.map(item => <li key={idOf(item)}><div className="ws-list-content"><h3>{labelOf(item)}</h3><p>{item.kind} · {item.originalName} · {(Number(item.size || 0) / 1048576).toFixed(2)} MB</p><Badge status={item.status} /> <Badge status={item.visibility} /></div><div className="ws-toolbar-actions"><button type="button" className="ws-secondary" onClick={() => setSelected(idOf(item))}>View media</button><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(item, "PATCH")}>Edit title</button><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(item, "DELETE")}>Delete</button></div></li>)}</ul><Pagination page={page} count={rows.length} pagination={state.pagination} onChange={setPage} loading={state.loading || working} /></>}
    </Card>
    {selected && <Card title="Media details"><State {...detail} retry={detail.reload} />{!detail.loading && !detail.error && record && <><h3>{labelOf(record)}</h3><dl className="ws-review">{["id", "kind", "originalName", "mimeType", "size", "width", "height", "visibility", "status", "version"].map(key => <div key={key}><dt>{key}</dt><dd>{record[key] ?? "Unavailable"}</dd></div>)}<div><dt>Updated</dt><dd>{date(record.updatedAt)}</dd></div></dl><MediaPreview key={`${idOf(record)}:${record.version}`} record={record} /><div className="ws-toolbar-actions"><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(record, "PATCH")}>Edit title</button><button type="button" className="ws-secondary" disabled={working || uploading} onClick={() => open(record, "DELETE")}>Delete</button><button type="button" className="ws-secondary" onClick={() => setSelected("")}>Close details</button></div></>}</Card>}
    {modal && <MutationDialog {...modal} description={modal.operation.method === "DELETE" ? "Delete this media? Other records may reuse it. To replace a form selection, remove its reference in that form instead. The backend decides whether deletion is allowed." : "Update the title using the latest media version."} onClose={() => setModal(null)} onSuccess={async () => { if (modal.operation.method === "DELETE") { if (idOf(modal.current) === selected) setSelected(""); setNotice("Media deleted."); await state.reload(); if (page > 1 && rows.length === 1) setPage(page - 1); } else { setNotice("Media title updated."); await updated(); } }} />}
  </div>;
}
