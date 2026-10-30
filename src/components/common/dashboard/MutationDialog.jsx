"use client";
/* eslint-disable @next/next/no-img-element -- Course previews must render selected public media without an image optimizer proxy. */
import { useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { idOf, rowsOf } from "./data";
import { Icon } from "./WorkspaceShell";
import { mediaBinding, permanentMediaHref, safePermanentMediaUrl } from "@/lib/dashboard/media";
import { PermanentImagePreview } from "./MediaControls";
import MediaPicker from "./MediaPicker";
import { validateMutationBody } from "@/lib/dashboard/form-validation";
import { useNotifications } from "@/components/common/NotificationCenter";
import "./course-create.css";

const labels = { regularPrice: "Regular price", discountPrice: "Discount price (optional)", categoryId: "Category", languageId: "Language", levelId: "Level", sectionId: "Curriculum section", startsAt: "Starts at", endsAt: "Ends at", registrationStartAt: "Registration starts", registrationEndAt: "Registration ends", thumbnail: "Thumbnail URL (optional)", thumbnailMediaId: "Thumbnail from Media Library", idempotencyKey: "Request key", routingCode: "Routing / IFSC code", country: "Country", body: "Message", reason: "Reason for this change", profileImageMediaId: "Profile photo", coverImageMediaId: "Cover photo", shortBio: "Short biography", fullBio: "Full biography", socialLinks: "Social links" };
const label = key => labels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, value => value.toUpperCase());
const choiceLabel = value => ({ ALL_MY_STUDENTS: "All my students", IN_APP: "In-app notification", EMAIL: "Email", CLASS: "Class", WORKSHOP: "Workshop", ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid", GOOGLE_MEET: "Google Meet", ZOOM: "Zoom", YOUTUBE: "YouTube", EXTERNAL_LINK: "External link", OTHER: "Other", INR: "INR", USD: "USD", EUR: "EUR", GBP: "GBP" }[value] || String(value).replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()));
const slugFromTitle = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
function localDateTime(value) { const parsed = new Date(value); if (!Number.isFinite(parsed.getTime())) return value || ""; return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function initial(schema, current) { if (schema.type === "object") return Object.fromEntries(Object.entries(schema.fields).map(([key, field]) => [key, initial(field, current?.[key])])); if (schema.type === "array") return Array.isArray(current) ? current : []; if (schema.type === "boolean") return typeof current === "boolean" ? current : false; return current ?? ""; }
function initialValue(operation, current) {
  const value = initial({ type: "object", fields: operation.fields }, current);
  if (operation.method === "POST" && operation.path === "facilitator/classes") return { ...value, timezone: value.timezone || "Asia/Kolkata", mode: value.mode || "OFFLINE", waitlistEnabled: true, regularPrice: value.regularPrice === "" ? 0 : value.regularPrice };
  return value;
}
function prepare(schema, value, key = "") { if (schema.type === "object") return Object.fromEntries(Object.entries(schema.fields).map(([key, field]) => [key, prepare(field, value?.[key], key)]).filter(([, child]) => child !== undefined)); if (schema.type === "array") return (Array.isArray(value) ? value : String(value || "").split(/\n/).filter(Boolean)).map(item => prepare(schema.item, item)); if (schema.type === "boolean") return Boolean(value); if (value === "" || value == null) return schema.nullable ? null : undefined; if (schema.type === "number") { const number = Number(value); if (!Number.isFinite(number)) throw new Error(`${label(key)} must be a number.`); return number; } if (/At$/.test(key) && Number.isFinite(Date.parse(value))) return new Date(value).toISOString(); return String(value).trim(); }
function CoursePreview({ value, choices, onChange, onMediaBusy }) {
  const thumbnail = permanentMediaHref(value.thumbnail);
  const category = choices.categoryId?.find(item => idOf(item) === value.categoryId);
  const level = choices.levelId?.find(item => idOf(item) === value.levelId);
  const price = value.regularPrice === "" || value.regularPrice == null ? "Free" : `${value.currency || "INR"} ${value.regularPrice}`;
  return <aside className="ws-course-preview" aria-label="Course preview">
    <section className="ws-course-thumbnail-card"><div className="ws-course-thumbnail-heading"><div><h3>Course thumbnail</h3><p>Choose a cover image for your course.</p></div><span>IMAGE</span></div><MediaPicker title="Course thumbnail" value={value.thumbnail} onChange={next => onChange({ ...value, thumbnail: next })} onBusyChange={onMediaBusy} /></section>
    <div className="ws-course-preview-label">LIVE PREVIEW</div>
    <div className="ws-course-preview-media">{thumbnail ? <img src={thumbnail} alt="" /> : <div className="ws-course-preview-placeholder"><span>◌</span><small>Your course image</small></div>}</div>
    <div className="ws-course-preview-body">
      <span className="ws-course-preview-kicker">COURSE</span>
      <h3>{value.title || "Your course title"}</h3>
      <p>{category?.name || category?.title || "Choose a category"}</p>
      <div className="ws-course-preview-meta"><span>{price}</span><span>{level?.name || level?.title || "Beginner"}</span></div>
      <p className="ws-course-preview-description">{value.shortDescription || "A short description will appear here."}</p>
    </div>
    <button type="button" className="ws-course-preview-cta" disabled>Save &amp; next <Icon name="arrow" size={14} /></button>
  </aside>;
}
function classFieldRequired(key, offlineClass) {
  if (["meetingType", "meetingUrl"].includes(key)) return !offlineClass;
  return ["title", "kind", "description", "categoryId", "startsAt", "endsAt", "timezone", "mode", "regularPrice", "currency", "capacity", "reason"].includes(key);
}
function Fields({ fields, value, onChange, choices = {}, prefix = "", operation, onMediaBusy, autoSlug = false, fieldLabels = {}, mediaPreviewValues = {}, skipRequired = false, classCreate = false }) {
  const relaxedRequired = skipRequired || operation?.path?.startsWith("facilitator/classes");
  const offlineClass = operation?.path?.startsWith("facilitator/classes") && value?.mode === "OFFLINE";
  return Object.entries(fields).filter(([key]) => !["version", "courseVersion", "registrationVersion", "idempotencyKey"].includes(key)).filter(([key]) => !(offlineClass && ["meetingType", "meetingUrl"].includes(key))).map(([key, schema]) => {
    const title = fieldLabels[key] || label(key); const current = value?.[key]; const required = classCreate ? classFieldRequired(key, offlineClass) : !relaxedRequired && !schema.nullable; const classThumbnail = operation?.path === "facilitator/classes" && ["thumbnail", "thumbnailMediaId"].includes(key); const update = next => onChange({ ...value, [key]: next, ...(classThumbnail ? { [key === "thumbnail" ? "thumbnailMediaId" : "thumbnail"]: "" } : {}), ...(autoSlug && key === "title" ? { slug: slugFromTitle(next) } : {}) });
    const binding = !prefix && operation ? mediaBinding(operation, key) || (operation.method === "POST" && operation.path === "facilitator/courses" && key === "banner" ? { multiple: false } : null) : null;
    if (binding) return <MediaPicker key={key} title={title} value={current} previewValue={mediaPreviewValues[key]} onChange={update} {...binding} onBusyChange={onMediaBusy} />;
    if (schema.type === "object") return <fieldset key={key}><legend>{title}</legend><div className="ws-form"><Fields fields={schema.fields} value={current || {}} onChange={update} choices={choices} prefix={`${prefix}${key}.`} autoSlug={autoSlug} fieldLabels={fieldLabels} mediaPreviewValues={mediaPreviewValues} skipRequired={skipRequired} classCreate={classCreate} /></div></fieldset>;
    if (schema.type === "array" && schema.item.type === "object") return <fieldset key={key}><legend>{title}</legend>{(current || []).map((item, index) => <div className="ws-card" key={index}><div className="ws-form"><Fields fields={schema.item.fields} value={item} onChange={next => update(current.map((row, i) => i === index ? next : row))} choices={choices} /></div><button type="button" className="ws-text-link" onClick={() => update(current.filter((_, i) => i !== index))}>Remove {title.toLowerCase()}</button></div>)}<button type="button" className="ws-secondary" onClick={() => update([...(current || []), initial(schema.item)])}>Add {title.toLowerCase()}</button></fieldset>;
    if (schema.type === "boolean") return <label className="ws-field" key={key}><span><input type="checkbox" checked={Boolean(current)} onChange={event => update(event.target.checked)} /> {title}</span></label>;
    if (schema.type === "array" && choices[key]) return <fieldset key={key}><legend>{title}</legend>{choices[key].map((option) => <label className="ws-field" key={option}><span><input type="checkbox" required={(classCreate ? classFieldRequired(key, offlineClass) : !relaxedRequired) && !(current || []).length} checked={(current || []).includes(option)} onChange={event => update(event.target.checked ? [...(current || []), option] : (current || []).filter(item => item !== option))} /> {choiceLabel(option)}</span></label>)}</fieldset>;
    const textArea = schema.type === "array" || /description|bio|experience|education|reason|comment|notes|body/i.test(key);
    if (choices[key]) return <label className="ws-field" key={key}>{title}<select className="ws-input" required={classCreate ? classFieldRequired(key, offlineClass) : !relaxedRequired && !schema.nullable} value={current || ""} onChange={event => update(event.target.value)}><option value="">Select {title.toLowerCase()}</option>{choices[key].map(item => <option key={typeof item === "string" ? item : idOf(item)} value={typeof item === "string" ? item : idOf(item)}>{typeof item === "string" ? choiceLabel(item) : item.name || item.title || item.displayName}</option>)}</select>{!choices[key].length && <small>No available options. Add this dependency before continuing.</small>}</label>;
      return <label className={`ws-field ${textArea ? "ws-field-full" : ""}`} key={key}>{title}{textArea ? <textarea className="ws-input" required={!relaxedRequired && !schema.nullable} value={Array.isArray(current) ? current.join("\n") : current || ""} onChange={event => update(schema.type === "array" ? event.target.value.split("\n") : event.target.value)} /> : <input className="ws-input" readOnly={autoSlug && key === "slug"} aria-describedby={autoSlug && key === "slug" ? "course-slug-help" : undefined} required={!relaxedRequired && !schema.nullable} placeholder={/At$/.test(key) ? "DD/MM/YYYY, HH:MM" : undefined} type={schema.type === "number" ? "number" : /At$/.test(key) ? "datetime-local" : /url|thumbnail/i.test(key) ? "url" : /password/i.test(key) ? "password" : "text"} min={schema.type === "number" && key !== "delta" ? 0 : undefined} minLength={/password/i.test(key) ? 8 : undefined} step={schema.type === "number" ? "any" : undefined} value={/At$/.test(key) && current ? localDateTime(current) : current ?? ""} onChange={event => update(event.target.value)} />}{autoSlug && key === "slug" && <small id="course-slug-help">Generated automatically from the title.</small>}{schema.type === "array" && <small>One value per line.</small>}{/At$/.test(key) && <small>Optional · DD/MM/YYYY, HH:MM · browser timezone.</small>}</label>;
  });
}
const courseSections = [
  { id: "basic", step: "1", title: "Basic information", description: "Add the essential details about your course.", keys: ["title", "shortDescription", "description", "languageId", "levelId"] },
  { id: "media", step: "2", title: "Course media", description: "Choose the thumbnail and banner used by the course.", keys: ["banner"] },
  { id: "outcomes", step: "3", title: "Learning outcomes", description: "Tell students what they will be able to take away.", keys: ["learningOutcomes"] },
  { id: "pricing", step: "4", title: "Pricing", description: "Set the actual price and currency accepted by the course API.", keys: ["regularPrice", "discountPrice", "currency"] },
  { id: "completion", step: "5", title: "Completion and certificate", description: "Set completion rules and certificate availability.", keys: ["certificateEnabled", "completionPolicy"] },
];
const courseFieldLabels = { title: "Course title", shortDescription: "Short description", description: "Course description", languageId: "Language", levelId: "Level", learningOutcomes: "Learning outcomes", regularPrice: "Regular price", discountPrice: "Discount price", currency: "Currency", banner: "Course banner", certificateEnabled: "Enable certificate", completionPolicy: "Completion policy", requiredLessonPercent: "Lessons required (%)", requirePassingQuizzes: "Require passing quizzes" };
function CourseFields({ fields, value, onChange, choices, operation, onMediaBusy, autoSlug }) {
  return <div className="ws-course-form-sections">{courseSections.map(section => {
    const sectionFields = Object.fromEntries(section.keys.filter(key => fields[key]).map(key => [key, fields[key]]));
    if (!Object.keys(sectionFields).length) return null;
    return <fieldset className={`ws-course-section ws-course-section-${section.id}`} key={section.id}><div className="ws-course-section-heading"><span className="ws-course-step">{section.step}</span><div><h3>{section.title}</h3><p>{section.description}</p></div></div><div className="ws-course-section-fields"><Fields fields={sectionFields} value={value} onChange={onChange} choices={choices} operation={operation} onMediaBusy={onMediaBusy} autoSlug={autoSlug} fieldLabels={courseFieldLabels} /></div></fieldset>;
  })}{fields.slug && <p className="ws-course-slug-note">The course URL slug is generated automatically from the course title.</p>}</div>;
}
const classSections = [
  { id: "details", step: "1", title: "Class details", description: "Add the complete description, category and thumbnail used for review.", keys: ["title", "kind", "description", "thumbnailMediaId", "categoryId"] },
  { id: "delivery", step: "2", title: "Delivery and schedule", description: "Tell learners when the class happens and how they will attend.", keys: ["startsAt", "endsAt", "timezone", "mode", "meetingType", "meetingUrl", "registrationStartAt", "registrationEndAt"] },
  { id: "pricing", step: "3", title: "Pricing and capacity", description: "Set the price, seats and the review note for this class.", keys: ["regularPrice", "discountPrice", "currency", "capacity", "waitlistEnabled", "reason"] },
];
const classFieldLabels = { title: "Title", kind: "Kind", description: "Description", thumbnailMediaId: "Thumbnail from Media Library", categoryId: "Category", startsAt: "Starts at", endsAt: "Ends at", timezone: "Timezone", mode: "Mode", meetingType: "Meeting Type", meetingUrl: "Meeting Url", registrationStartAt: "Registration opens", registrationEndAt: "Registration closes", regularPrice: "Regular price", discountPrice: "Discount price (optional)", currency: "Currency", capacity: "Capacity", waitlistEnabled: "Enable waitlist", reason: "Reason for this change" };
function ClassFields({ fields, value, onChange, choices, operation, onMediaBusy }) {
  return <div className="ws-class-create-sections">{classSections.map(section => {
    const sectionFields = Object.fromEntries(section.keys.filter(key => fields[key]).map(key => [key, fields[key]]));
    if (!Object.keys(sectionFields).length) return null;
    return <fieldset className={`ws-class-create-section ws-class-create-section-${section.id}`} key={section.id}><div className="ws-course-section-heading"><span className="ws-course-step">{section.step}</span><div><h3>{section.title}</h3><p>{section.description}</p></div></div><div className="ws-course-section-fields"><Fields fields={sectionFields} value={value} onChange={onChange} choices={choices} operation={operation} onMediaBusy={onMediaBusy} fieldLabels={classFieldLabels} classCreate /></div></fieldset>;
  })}</div>;
}
export default function MutationDialog({ operation, path, detailPath, current = {}, choices = {}, title, description, submitLabel, prepareBody, dependenciesLoading = false, dependencyError, retryDependencies, onClose, onSuccess, courseVersion, courseDetailPath, variant = "default", autoSlug = false, mediaPreviewValues = {}, skipRequired = false }) {
  const notifications = useNotifications();
  const [value, setValue] = useState(() => initialValue(operation, current)); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false); const intent = useRef(null); const container = useRef(null); const previousFocus = useRef(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const classCreate = operation.method === "POST" && operation.path === "facilitator/classes";
  const relaxedRequired = skipRequired || operation.path.startsWith("facilitator/classes");
  const relaxedDependencies = operation.path.startsWith("facilitator/classes") && !classCreate;
  const savedImages = operation.method === "PATCH" && !operation.fields.thumbnail && !operation.fields.images
    ? typeof current.thumbnail === "string" ? [current.thumbnail] : Array.isArray(current.images) ? current.images.filter(item => typeof item === "string") : [] : [];
  useEffect(() => { previousFocus.current = document.activeElement; container.current?.querySelector("input,select,textarea,button")?.focus(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; previousFocus.current?.focus(); }; }, []);
  async function submit(event) {
    event.preventDefault(); if (lock.current || mediaBusy || (dependenciesLoading && !relaxedDependencies) || (dependencyError && !relaxedDependencies)) return; lock.current = true; setBusy(true); setError("");
    try {
      let body = prepare({ type: "object", fields: operation.fields }, value);
      if (operation.path.startsWith("facilitator/classes") && typeof body.mode === "string" && body.mode) body.mode = body.mode.toUpperCase();
      if (operation.method === "POST" && operation.path === "facilitator/classes") {
        body.kind ||= "WORKSHOP";
        body.mode ||= "OFFLINE";
        body.currency ||= "INR";
        body.timezone ||= "Asia/Kolkata";
        if (body.regularPrice == null) body.regularPrice = 0;
        if (body.waitlistEnabled == null) body.waitlistEnabled = true;
        for (const key of ["endsAt", "registrationStartAt", "registrationEndAt"]) {
          if (body[key] == null || body[key] === "") delete body[key];
        }
        if (body.thumbnailMediaId) delete body.thumbnail;
        else if (body.thumbnail) delete body.thumbnailMediaId;
        else { delete body.thumbnail; delete body.thumbnailMediaId; }
      }
      if (operation.path.startsWith("facilitator/classes") && (body.mode || current.mode) === "OFFLINE") {
        delete body.meetingType;
        delete body.meetingUrl;
      }
      for (const key of Object.keys(operation.fields)) {
        const binding = mediaBinding(operation, key) || (operation.method === "POST" && operation.path === "facilitator/courses" && key === "banner" ? { multiple: false } : null);
        if (!binding) continue;
        const urls = binding.multiple ? body[key] || [] : body[key] ? [body[key]] : [];
        if (binding.valueType === "id") {
          if (urls.some(id => typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id))) throw new Error(label(key) + " requires a valid media ID.");
        } else if ((!urls.length && key !== "banner" && !(operation.path === "facilitator/classes" && key === "thumbnail")) || urls.some(url => !safePermanentMediaUrl(url))) throw new Error(label(key) + " requires a permanent image URL. Private access links cannot be saved here.");
      }
      if (operation.path === "facilitator/classes" && body.thumbnail && !safePermanentMediaUrl(body.thumbnail)) throw new Error("Thumbnail URL must be a permanent public image URL.");
      let latest = current;
      if (detailPath && (operation.fields.version || operation.fields.courseVersion || operation.fields.registrationVersion)) { const result = await accountFetch(detailPath); latest = result.data?.announcement || result.data?.course || result.data?.product || result.data?.class || result.data?.registration || result.data?.question || result.data?.quiz || result.data?.profile || result.data; }
      for (const key of ["version", "registrationVersion"]) if (operation.fields[key]) { if (latest?.version == null) throw new Error("The latest resource version is unavailable. Refresh and try again."); body[key] = latest.version; }
      if (operation.fields.courseVersion) { let version = latest?.version ?? courseVersion; if (courseDetailPath) { const course = await accountFetch(courseDetailPath); version = (course.data?.course || course.data)?.version; } if (version == null) throw new Error("Load the current course before updating its curriculum."); body.courseVersion = version; }
      if (operation.fields.idempotencyKey) { const signature = JSON.stringify(body); if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() }; body.idempotencyKey = intent.current.key; }
      if (prepareBody) body = prepareBody(body, latest);
      validateMutationBody(operation.fields, body, { skipRequired: relaxedRequired, classCreate: operation.method === "POST" && operation.path === "facilitator/classes" });
      const result = await accountFetch(path, { method: operation.method, body }); await onSuccess(result);
      notifications.success(result.message || (operation.method === "DELETE" ? "The item was removed." : "Your changes were saved."), { title: operation.method === "DELETE" ? "Removed" : "Changes saved" });
      onClose();
    } catch (caught) { const message = caught.status === 409 ? `${caught.message} Reload the record and review your changes before retrying.` : caught.message || "We could not save your changes."; setError(message); notifications.error(message, { title: "Couldn’t save changes" }); }
    finally { lock.current = false; setBusy(false); }
  }
  const fields = variant === "course-create" ? Object.fromEntries(["title", "shortDescription", "description", "thumbnail", "banner", "languageId", "levelId", "learningOutcomes", "regularPrice", "discountPrice", "currency", "certificateEnabled", "completionPolicy"].filter(key => operation.fields[key]).map(key => [key, operation.fields[key]])) : operation.fields;
  const form = <form onSubmit={submit} className={`ws-form ${variant === "course-create" ? "ws-course-create-form" : classCreate ? "ws-class-create-form" : ""}`}>{variant === "course-create" ? <div className="ws-course-create-layout"><fieldset className="ws-mutation-fields ws-course-main-fields" disabled={busy}><legend className="ws-sr-only">Course details</legend><CourseFields fields={fields} value={value} onChange={setValue} choices={choices} operation={operation} onMediaBusy={setMediaBusy} autoSlug={autoSlug} /></fieldset><CoursePreview value={value} choices={choices} onChange={setValue} onMediaBusy={setMediaBusy} /></div> : classCreate ? <fieldset className="ws-mutation-fields" disabled={busy}><legend className="ws-sr-only">Class details</legend><ClassFields fields={fields} value={value} onChange={setValue} choices={choices} operation={operation} onMediaBusy={setMediaBusy} /></fieldset> : <fieldset className="ws-mutation-fields" disabled={busy}><legend className="ws-sr-only">Record details</legend><div className="ws-form"><Fields fields={fields} value={value} onChange={setValue} choices={choices} operation={operation} onMediaBusy={setMediaBusy} autoSlug={autoSlug} mediaPreviewValues={mediaPreviewValues} skipRequired={skipRequired} /></div></fieldset>}
    <div className="ws-field-full ws-toolbar-actions"><button className="ws-button" disabled={busy || mediaBusy || (dependenciesLoading && !relaxedDependencies) || (Boolean(dependencyError) && !relaxedDependencies)}>{busy ? "Saving..." : submitLabel || (variant === "course-create" ? "Save & next" : classCreate ? "Create class" : operation.method === "DELETE" ? "Confirm removal" : "Save changes")}</button><button type="button" className="ws-secondary" disabled={busy || mediaBusy} onClick={onClose}>Cancel</button></div>
  </form>;
  return <div className={`ws-dialog ${operation.path.startsWith("facilitator/classes") ? "ws-dialog-class" : ""} ${variant === "course-create" ? "ws-dialog-course" : ""}`} onKeyDown={event => {
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
    {form}
  </section></div>;
}
