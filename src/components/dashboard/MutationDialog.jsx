"use client";
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { idOf, rowsOf } from "./data";
import { Icon } from "./WorkspaceShell";
import { mediaBinding, safePermanentMediaUrl } from "@/lib/dashboard/media";
import { MediaField, PermanentImagePreview } from "./MediaControls";

const labels = { regularPrice: "Regular price", discountPrice: "Discount price (optional)", categoryId: "Category", languageId: "Language", levelId: "Level", sectionId: "Curriculum section", startsAt: "Starts at", endsAt: "Ends at", registrationStartAt: "Registration opens", registrationEndAt: "Registration closes", idempotencyKey: "Request key", routingCode: "Routing / IFSC code", country: "Country", body: "Message", reason: "Reason for this change" };
const label = key => labels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, value => value.toUpperCase());
function localDateTime(value) { const parsed = new Date(value); if (!Number.isFinite(parsed.getTime())) return value || ""; return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function initial(schema, current) { if (schema.type === "object") return Object.fromEntries(Object.entries(schema.fields).map(([key, field]) => [key, initial(field, current?.[key])])); if (schema.type === "array") return Array.isArray(current) ? current : []; if (schema.type === "boolean") return typeof current === "boolean" ? current : false; return current ?? ""; }
function prepare(schema, value, key = "") { if (schema.type === "object") return Object.fromEntries(Object.entries(schema.fields).map(([key, field]) => [key, prepare(field, value?.[key], key)]).filter(([, child]) => child !== undefined)); if (schema.type === "array") return (Array.isArray(value) ? value : String(value || "").split(/\n/).filter(Boolean)).map(item => prepare(schema.item, item)); if (schema.type === "boolean") return Boolean(value); if (value === "" || value == null) return schema.nullable ? null : undefined; if (schema.type === "number") { const number = Number(value); if (!Number.isFinite(number)) throw new Error(`${label(key)} must be a number.`); return number; } if (/At$/.test(key) && Number.isFinite(Date.parse(value))) return new Date(value).toISOString(); return String(value).trim(); }
function Fields({ fields, value, onChange, choices = {}, prefix = "", operation, onMediaBusy }) {
  return Object.entries(fields).filter(([key]) => !["version", "courseVersion", "registrationVersion", "idempotencyKey"].includes(key)).map(([key, schema]) => {
    const title = label(key); const current = value?.[key]; const update = next => onChange({ ...value, [key]: next });
    const binding = !prefix && operation ? mediaBinding(operation, key) : null;
    if (binding) return <MediaField key={key} title={title} value={current} onChange={update} {...binding} onBusyChange={onMediaBusy} />;
    if (schema.type === "object") return <fieldset key={key}><legend>{title}</legend><div className="ws-form"><Fields fields={schema.fields} value={current || {}} onChange={update} choices={choices} prefix={`${prefix}${key}.`} /></div></fieldset>;
    if (schema.type === "array" && schema.item.type === "object") return <fieldset key={key}><legend>{title}</legend>{(current || []).map((item, index) => <div className="ws-card" key={index}><div className="ws-form"><Fields fields={schema.item.fields} value={item} onChange={next => update(current.map((row, i) => i === index ? next : row))} choices={choices} /></div><button type="button" className="ws-text-link" onClick={() => update(current.filter((_, i) => i !== index))}>Remove {title.toLowerCase()}</button></div>)}<button type="button" className="ws-secondary" onClick={() => update([...(current || []), initial(schema.item)])}>Add {title.toLowerCase()}</button></fieldset>;
    if (schema.type === "boolean") return <label className="ws-field" key={key}><span><input type="checkbox" checked={Boolean(current)} onChange={event => update(event.target.checked)} /> {title}</span></label>;
    if (schema.type === "array" && choices[key]) return <fieldset key={key}><legend>{title}</legend>{choices[key].map((option, index) => <label className="ws-field" key={option}><span><input type="checkbox" required={index === 0 && !(current || []).length} checked={(current || []).includes(option)} onChange={event => update(event.target.checked ? [...(current || []), option] : (current || []).filter(item => item !== option))} /> {option === "IN_APP" ? "In-app notification" : option === "EMAIL" ? "Email" : option}</span></label>)}</fieldset>;
    const textArea = schema.type === "array" || /description|bio|experience|education|reason|comment|notes|body/i.test(key);
    if (choices[key]) return <label className="ws-field" key={key}>{title}<select className="ws-input" required value={current || ""} onChange={event => update(event.target.value)}><option value="">Select {title.toLowerCase()}</option>{choices[key].map(item => <option key={typeof item === "string" ? item : idOf(item)} value={typeof item === "string" ? item : idOf(item)}>{typeof item === "string" ? item === "ALL_MY_STUDENTS" ? "All my students" : item : item.name || item.title || item.displayName}</option>)}</select>{!choices[key].length && <small>No available options. Add this dependency before continuing.</small>}</label>;
    return <label className={`ws-field ${textArea ? "ws-field-full" : ""}`} key={key}>{title}{textArea ? <textarea className="ws-input" required={!schema.nullable} value={Array.isArray(current) ? current.join("\n") : current || ""} onChange={event => update(schema.type === "array" ? event.target.value.split("\n") : event.target.value)} /> : <input className="ws-input" required={!schema.nullable} type={schema.type === "number" ? "number" : /At$/.test(key) ? "datetime-local" : /url|thumbnail/i.test(key) ? "url" : /password/i.test(key) ? "password" : "text"} min={schema.type === "number" && key !== "delta" ? 0 : undefined} minLength={/password/i.test(key) ? 8 : undefined} step={schema.type === "number" ? "any" : undefined} value={/At$/.test(key) && current ? localDateTime(current) : current ?? ""} onChange={event => update(event.target.value)} />}{schema.type === "array" && <small>One value per line.</small>}{/At$/.test(key) && <small>Time uses your browser timezone.</small>}</label>;
  });
}
export default function MutationDialog({ operation, path, detailPath, current = {}, choices = {}, title, description, submitLabel, prepareBody, dependenciesLoading = false, dependencyError, retryDependencies, onClose, onSuccess, courseVersion, courseDetailPath }) {
  const [value, setValue] = useState(() => initial({ type: "object", fields: operation.fields }, current)); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false); const intent = useRef(null); const container = useRef(null); const previousFocus = useRef(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const savedImages = operation.method === "PATCH" && !operation.fields.thumbnail && !operation.fields.images
    ? typeof current.thumbnail === "string" ? [current.thumbnail] : Array.isArray(current.images) ? current.images.filter(item => typeof item === "string") : [] : [];
  useEffect(() => { previousFocus.current = document.activeElement; container.current?.querySelector("input,select,textarea,button")?.focus(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; previousFocus.current?.focus(); }; }, []);
  async function submit(event) {
    event.preventDefault(); if (lock.current || mediaBusy || dependenciesLoading || dependencyError) return; lock.current = true; setBusy(true); setError("");
    try {
      let body = prepare({ type: "object", fields: operation.fields }, value);
      for (const key of Object.keys(operation.fields)) {
        const binding = mediaBinding(operation, key);
        if (!binding) continue;
        const urls = binding.multiple ? body[key] || [] : body[key] ? [body[key]] : [];
        if (!urls.length || urls.some(url => !safePermanentMediaUrl(url))) throw new Error(label(key) + " requires a permanent image URL. Private access links cannot be saved here.");
      }
      let latest = current;
      if (detailPath && (operation.fields.version || operation.fields.courseVersion || operation.fields.registrationVersion)) { const result = await accountFetch(detailPath); latest = result.data?.announcement || result.data?.course || result.data?.product || result.data?.class || result.data?.registration || result.data?.question || result.data?.quiz || result.data?.profile || result.data; }
      for (const key of ["version", "registrationVersion"]) if (operation.fields[key]) { if (latest?.version == null) throw new Error("The latest resource version is unavailable. Refresh and try again."); body[key] = latest.version; }
      if (operation.fields.courseVersion) { let version = latest?.version ?? courseVersion; if (courseDetailPath) { const course = await accountFetch(courseDetailPath); version = (course.data?.course || course.data)?.version; } if (version == null) throw new Error("Load the current course before updating its curriculum."); body.courseVersion = version; }
      if (operation.fields.idempotencyKey) { const signature = JSON.stringify(body); if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() }; body.idempotencyKey = intent.current.key; }
      if (prepareBody) body = prepareBody(body, latest);
      const result = await accountFetch(path, { method: operation.method, body }); await onSuccess(result); onClose();
    } catch (caught) { setError(caught.status === 409 ? `${caught.message} Reload the record and review your changes before retrying.` : caught.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="ws-dialog" onKeyDown={event => {
    if (event.key === "Escape" && !busy && !mediaBusy) onClose();
    if (event.key === "Tab") {
      const nodes = [...container.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')];
      const first = nodes[0]; const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><section className="ws-dialog-content" role="dialog" aria-modal="true" aria-labelledby="ws-mutation-title" ref={container}>
    <div className="ws-card-header"><h2 id="ws-mutation-title">{title}</h2><button type="button" className="ws-icon-button" aria-label="Close form" disabled={busy || mediaBusy} onClick={onClose}><Icon name="close" /></button></div>
    {description && <p className="ws-muted">{description}</p>}
    {!!savedImages.length && <div className="ws-media-selections">{savedImages.map((url, index) => <PermanentImagePreview key={url + ':' + index} value={url} />)}<p className="ws-muted">Saved images. Image editing is currently unavailable.</p></div>}
    {dependenciesLoading && <p role="status" className="ws-muted">Loading available options...</p>}
    {dependencyError && <p role="alert" className="ws-alert">{dependencyError}{retryDependencies && <button type="button" onClick={retryDependencies}>Retry options</button>}</p>}
    {error && <p className="ws-alert" role="alert">{error}</p>}
    <form onSubmit={submit} className="ws-form"><fieldset className="ws-mutation-fields" disabled={busy}><legend className="ws-sr-only">Record details</legend><div className="ws-form"><Fields fields={operation.fields} value={value} onChange={setValue} choices={choices} operation={operation} onMediaBusy={setMediaBusy} /></div></fieldset>
      <div className="ws-field-full ws-toolbar-actions"><button className="ws-button" disabled={busy || mediaBusy || dependenciesLoading || Boolean(dependencyError)}>{busy ? "Saving..." : submitLabel || (operation.method === "DELETE" ? "Confirm removal" : "Save changes")}</button><button type="button" className="ws-secondary" disabled={busy || mediaBusy} onClick={onClose}>Cancel</button></div>
    </form>
  </section></div>;
}
