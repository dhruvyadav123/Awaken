"use client";

import { useState } from "react";
import MediaPicker from "../MediaPicker";
import { courseWrite, pathForCourse, recordId, schemas } from "./course-api";
import { btn, dangerBtn, input, label, lightBtn, Note, panel, Status, Busy, Confirm, useLoad } from "./CourseUI";

// These are the content types exposed by the lesson API contract used by the facilitator flow.
const lessonTypes = ["VIDEO", "AUDIO", "TEXT", "IMAGE", "PDF", "DOWNLOAD", "LIVE_LINK"];
const contentFields = {
  VIDEO: ["videoSource", "videoUrl", "videoMediaId"],
  AUDIO: ["audioUrl", "audioMediaId"],
  TEXT: ["textContent"],
  IMAGE: ["imageUrl", "imageMediaId"],
  PDF: ["documentUrl", "documentMediaId"],
  DOWNLOAD: ["documentUrl", "documentMediaId"],
  LIVE_LINK: ["liveUrl", "classId"],
};
const mediaKinds = { videoMediaId: "VIDEO", audioMediaId: "AUDIO", imageMediaId: "IMAGE", documentMediaId: "DOCUMENT" };
const mediaLabels = { videoMediaId: "Video", audioMediaId: "Audio", imageMediaId: "Image", documentMediaId: "Document" };

function lessonsOf(section) {
  return Array.isArray(section?.lessons) ? section.lessons : Array.isArray(section?.items) ? section.items : [];
}

function lessonHasContent(lesson) {
  return Boolean(
    lesson?.videoMediaId || lesson?.audioMediaId || lesson?.documentMediaId || lesson?.imageMediaId ||
    lesson?.videoUrl || lesson?.audioUrl || lesson?.documentUrl || lesson?.imageUrl || lesson?.liveUrl || lesson?.textContent,
  );
}

function initialLesson(current, sectionId) {
  return {
    sectionId: current?.sectionId || sectionId || "", title: current?.title || "", description: current?.description || "",
    contentType: lessonTypes.includes(current?.contentType) ? current.contentType : "VIDEO", duration: current?.duration ?? 0,
    displayOrder: current?.displayOrder ?? "", isPreview: current?.isPreview === true, status: current?.status || "DRAFT",
    videoSource: current?.videoSource === "URL" ? "EXTERNAL_URL" : current?.videoSource || "", videoUrl: current?.videoUrl || "", videoMediaId: current?.videoMediaId || "",
    audioUrl: current?.audioUrl || "", audioMediaId: current?.audioMediaId || "", documentUrl: current?.documentUrl || "",
    documentMediaId: current?.documentMediaId || "", imageUrl: current?.imageUrl || "", imageMediaId: current?.imageMediaId || "",
    textContent: current?.textContent || "", liveUrl: current?.liveUrl || "",
  };
}

function optionalText(value, editing) {
  const text = String(value ?? "").trim();
  return text || (editing ? null : undefined);
}

function videoSourceForUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "YOUTUBE";
    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) return "VIMEO";
  } catch {
    // The backend will return the precise URL validation error on submit.
  }
  return "EXTERNAL_URL";
}

function lessonPayload(value, editing) {
  const fields = contentFields[value.contentType] || [];
  const mediaPairs = [
    ["videoUrl", "videoMediaId"],
    ["audioUrl", "audioMediaId"],
    ["documentUrl", "documentMediaId"],
    ["imageUrl", "imageMediaId"],
  ];
  const body = {
    sectionId: optionalText(value.sectionId, editing), title: optionalText(value.title, editing), description: optionalText(value.description, editing),
    contentType: optionalText(value.contentType, editing), duration: value.duration === "" ? 0 : Number(value.duration),
    displayOrder: value.displayOrder === "" ? (editing ? null : undefined) : Number(value.displayOrder), isPreview: Boolean(value.isPreview),
  };
  if (editing) body.status = optionalText(value.status, true);
  const pairedFields = new Set(mediaPairs.flat());
  for (const key of fields) {
    if (!pairedFields.has(key)) body[key] = optionalText(value[key], editing);
  }
  for (const [urlKey, mediaKey] of mediaPairs) {
    if (!fields.includes(urlKey) && !fields.includes(mediaKey)) continue;
    const url = String(value[urlKey] ?? "").trim();
    const mediaId = String(value[mediaKey] ?? "").trim();
    if (mediaId) body[mediaKey] = mediaId;
    else if (url) body[urlKey] = url;
    else if (editing && fields.includes(urlKey)) body[urlKey] = "";
  }
  return Object.fromEntries(Object.entries(body).filter(([, item]) => item !== undefined && (!Number.isNaN(item) || typeof item !== "number")));
}

function LessonMediaField({ value, urlKey, mediaKey, onUrlChange, onMediaChange }) {
  const kind = mediaKinds[mediaKey];
  return <div className="rounded-xl border border-[#e0e9e2] bg-[#fbfdfb] p-3 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#263e30]">{mediaLabels[mediaKey]} content</p><p className="mt-1 text-xs text-slate-500">Use a permanent URL or choose an existing library file.</p></div><span className="rounded-full bg-[#eaf3eb] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#315a48]">{kind}</span></div>
    <label className={label}>{mediaLabels[mediaKey]} URL<input className={input} type="text" inputMode="url" value={value[urlKey]} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://" /></label>
    <div className="mt-3"><MediaPicker title={`${mediaLabels[mediaKey]} from Media Library`} value={value[mediaKey]} valueType="id" mediaKind={kind} allowNonPublic onChange={onMediaChange} onSelectRecord={onMediaChange} /></div>
  </div>;
}

export function LessonEditor({ courseId, sections, sectionId, current, close, saved }) {
  const editing = Boolean(current);
  const [value, setValue] = useState(() => initialLesson(current, sectionId));
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const update = (key, next) => setValue((old) => ({ ...old, [key]: next }));
  const changeContentType = (next) => setValue((old) => {
    const allowed = new Set(contentFields[next] || []);
    const cleared = Object.fromEntries(Object.values(contentFields).flat().filter((key) => !allowed.has(key)).map((key) => [key, ""]));
    return { ...old, ...cleared, contentType: next, videoSource: next === "VIDEO" ? old.videoSource : "" };
  });
  const changeUrl = (urlKey, mediaKey, next) => setValue((old) => ({
    ...old,
    [urlKey]: next,
    [mediaKey]: "",
    ...(mediaKey === "videoMediaId" ? { videoSource: next.trim() ? videoSourceForUrl(next) : "" } : {}),
  }));
  const chooseMedia = (mediaKey, selection) => {
    const id = typeof selection === "string" ? selection : selection?.id || "";
    setValue((old) => ({ ...old, [mediaKey]: id, [mediaKey.replace("MediaId", "Url")]: "", ...(mediaKey === "videoMediaId" ? { videoSource: id ? "UPLOAD" : "" } : {}) }));
  };

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await courseWrite({
        method: editing ? "PATCH" : "POST",
        path: editing ? `${pathForCourse(courseId)}/lessons/${encodeURIComponent(recordId(current))}` : `${pathForCourse(courseId)}/lessons`,
        template: editing ? schemas.lessonItem : schemas.lesson, courseId,
        values: lessonPayload(value, editing),
        versionPath: editing ? `${pathForCourse(courseId)}/lessons/${encodeURIComponent(recordId(current))}` : pathForCourse(courseId),
        onConflict: () => saved?.(),
      });
      await saved?.(result?.data?.lesson || result?.data); close();
    } catch (caught) { setError(caught.message || "Lesson could not be saved."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-4 rounded-2xl border border-[#dbe7dd] bg-[#f7faf7] p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b8c75]">{editing ? "Lesson editor" : "New lesson"}</p><h4 className="mt-1 text-lg font-semibold text-[#263e30]">{editing ? "Update lesson" : "Create lesson"}</h4></div><button type="button" className={lightBtn} onClick={close}>Close</button></div>
    <Note error={error} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={`${label} sm:col-span-2`}>Lesson title<input className={input} value={value.title} onChange={(event) => update("title", event.target.value)} /></label>
      <label className={`${label} sm:col-span-2`}>Description<textarea className={input} rows={3} value={value.description} onChange={(event) => update("description", event.target.value)} /></label>
      <label className={label}>Section<select className={input} value={value.sectionId} onChange={(event) => update("sectionId", event.target.value)}><option value="">Select section</option>{sections.map((section) => <option key={recordId(section)} value={recordId(section)}>{section.title || recordId(section)}</option>)}</select></label>
      <label className={label}>Content type<select className={input} value={value.contentType} onChange={(event) => changeContentType(event.target.value)}>{lessonTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      <label className={label}>Duration (minutes)<input className={input} type="number" min="0" value={value.duration} onChange={(event) => update("duration", event.target.value)} /></label>
      <label className={label}>Display order<input className={input} type="number" min="0" value={value.displayOrder} onChange={(event) => update("displayOrder", event.target.value)} /></label>
      {value.contentType === "VIDEO" && <><label className={label}>Video source<select className={input} value={value.videoSource} onChange={(event) => update("videoSource", event.target.value)}><option value="">Select source</option><option value="UPLOAD">Uploaded video</option><option value="YOUTUBE">YouTube</option><option value="VIMEO">Vimeo</option><option value="EXTERNAL_URL">External URL</option></select></label><div className="sm:col-span-2"><LessonMediaField value={value} urlKey="videoUrl" mediaKey="videoMediaId" onUrlChange={(next) => changeUrl("videoUrl", "videoMediaId", next)} onMediaChange={(next) => chooseMedia("videoMediaId", next)} /></div></>}
      {value.contentType === "AUDIO" && <div className="sm:col-span-2"><LessonMediaField value={value} urlKey="audioUrl" mediaKey="audioMediaId" onUrlChange={(next) => changeUrl("audioUrl", "audioMediaId", next)} onMediaChange={(next) => chooseMedia("audioMediaId", next)} /></div>}
      {value.contentType === "IMAGE" && <div className="sm:col-span-2"><LessonMediaField value={value} urlKey="imageUrl" mediaKey="imageMediaId" onUrlChange={(next) => changeUrl("imageUrl", "imageMediaId", next)} onMediaChange={(next) => chooseMedia("imageMediaId", next)} /></div>}
      {value.contentType === "DOCUMENT" && <div className="sm:col-span-2"><LessonMediaField value={value} urlKey="documentUrl" mediaKey="documentMediaId" onUrlChange={(next) => changeUrl("documentUrl", "documentMediaId", next)} onMediaChange={(next) => chooseMedia("documentMediaId", next)} /></div>}
      {value.contentType === "TEXT" && <label className={`${label} sm:col-span-2`}>Text content<textarea className={input} rows={7} value={value.textContent} onChange={(event) => update("textContent", event.target.value)} /></label>}
      {value.contentType === "LIVE" && <label className={label}>Live URL<input className={input} type="text" inputMode="url" value={value.liveUrl} onChange={(event) => update("liveUrl", event.target.value)} placeholder="https://" /></label>}
      <label className="flex items-center gap-2 text-sm text-[#354e40]"><input type="checkbox" checked={value.isPreview} onChange={(event) => update("isPreview", event.target.checked)} /> Available as preview</label>
      {editing && <label className={label}>Status<select className={input} value={value.status} onChange={(event) => update("status", event.target.value)}><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option></select></label>}
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="submit" className={btn} disabled={busy}>{busy ? "Saving..." : editing ? "Save lesson" : "Create lesson"}</button><button type="button" className={lightBtn} disabled={busy} onClick={close}>Cancel</button></div>
  </form>;
}

export default function CourseCurriculum({ courseId }) {
  const state = useLoad(`${pathForCourse(courseId)}/curriculum`);
  const [sectionForm, setSectionForm] = useState(null); const [lessonForm, setLessonForm] = useState(null); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [confirmation, setConfirmation] = useState(null);
  const sections = Array.isArray(state.data) ? state.data : state.data?.sections || [];
  async function refresh(message = "") { await state.reload(); setNotice(message); }
  async function saveSection(event) { event.preventDefault(); setBusy(true); setError(""); try { await courseWrite({ method: sectionForm.id ? "PATCH" : "POST", path: sectionForm.id ? `${pathForCourse(courseId)}/sections/${encodeURIComponent(sectionForm.id)}` : `${pathForCourse(courseId)}/sections`, template: sectionForm.id ? schemas.sectionItem : schemas.section, courseId, values: { title: sectionForm.title }, versionPath: pathForCourse(courseId) }); setSectionForm(null); await refresh(sectionForm.id ? "Section updated." : "Section added."); } catch (caught) { setError(caught.message || "Section could not be saved."); } finally { setBusy(false); } }
  async function removeSection(section) { setBusy(true); setError(""); try { await courseWrite({ method: "DELETE", path: `${pathForCourse(courseId)}/sections/${encodeURIComponent(recordId(section))}`, template: schemas.sectionItem, courseId, values: { reason: "Remove an unused course section." }, versionPath: pathForCourse(courseId) }); await refresh("Section removed."); } catch (caught) { setError(caught.message || "Section could not be removed."); } finally { setBusy(false); } }
  async function removeLesson(lesson) { setBusy(true); setError(""); try { await courseWrite({ method: "DELETE", path: `${pathForCourse(courseId)}/lessons/${encodeURIComponent(recordId(lesson))}`, template: schemas.lessonItem, courseId, values: { reason: "Remove an unused lesson." }, versionPath: pathForCourse(courseId) }); await refresh("Lesson removed."); } catch (caught) { setError(caught.message || "Lesson could not be removed."); } finally { setBusy(false); } }
  async function reorderSection(index, direction) { const next = [...sections]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setBusy(true); setError(""); try { await courseWrite({ method: "PATCH", path: `${pathForCourse(courseId)}/sections/order`, template: schemas.sectionOrder, courseId, values: { ids: next.map(recordId) }, versionPath: pathForCourse(courseId) }); await refresh("Section order updated."); } catch (caught) { setError(caught.message || "Section order could not be updated."); } finally { setBusy(false); } }
  async function reorderLesson(section, index, direction) { const lessons = lessonsOf(section); const target = index + direction; if (target < 0 || target >= lessons.length) return; const next = [...lessons]; [next[index], next[target]] = [next[target], next[index]]; setBusy(true); setError(""); try { await courseWrite({ method: "PATCH", path: `${pathForCourse(courseId)}/sections/${encodeURIComponent(recordId(section))}/lessons/order`, template: schemas.lessonOrder, courseId, values: { ids: next.map(recordId) }, versionPath: pathForCourse(courseId) }); await refresh("Lesson order updated."); } catch (caught) { setError(caught.message || "Lesson order could not be updated."); } finally { setBusy(false); } }

  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#263e30]">Curriculum &amp; lessons</h2><p className="mt-1 text-sm text-slate-500">Build sections and lessons in the order learners will follow.</p></div><button className={btn} type="button" onClick={() => setSectionForm({ title: "" })}>+ Add section</button></div><Note error={error} success={notice} /><section className={panel}><Busy state={state} empty="No curriculum sections yet." />{sections.map((section, index) => { const lessons = lessonsOf(section); return <article key={recordId(section)} className="rounded-xl border border-[#dbe7dd] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eaf3eb] text-xs font-bold text-[#315a48]">{index + 1}</span><h3 className="text-lg font-semibold text-[#263e30]">{section.title}</h3><Status value={section.status} /></div><p className="mt-2 text-xs text-slate-500">{lessons.length} lessons · order {section.displayOrder ?? index}</p></div><div className="flex flex-wrap gap-2"><button type="button" aria-label={`Move ${section.title} up`} className={lightBtn} disabled={busy || index === 0} onClick={() => reorderSection(index, -1)}>↑</button><button type="button" aria-label={`Move ${section.title} down`} className={lightBtn} disabled={busy || index === sections.length - 1} onClick={() => reorderSection(index, 1)}>↓</button><button type="button" className={lightBtn} disabled={busy} onClick={() => setSectionForm({ id: recordId(section), title: section.title })}>Edit</button><button type="button" className={dangerBtn} disabled={busy} onClick={() => setConfirmation({ type: "section", item: section })}>Remove</button></div></div><div className="mt-4 space-y-2">{lessons.map((lesson, lessonIndex) => <div key={recordId(lesson)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"><div className="min-w-0"><p className="break-words text-sm font-semibold text-[#294b38]">{lessonIndex + 1}. {lesson.title || "Untitled lesson"}</p><p className="mt-1 text-xs text-slate-500">{lesson.contentType || "CONTENT"} · {lesson.duration || 0} min · {lesson.videoMediaId || lesson.audioMediaId || lesson.documentMediaId || lesson.imageMediaId ? "Media Library file" : lessonHasContent(lesson) ? "Content attached" : "No content attached"}</p></div><div className="flex flex-wrap gap-2"><Status value={lesson.status} /><button type="button" className={lightBtn} aria-label={`Move ${lesson.title || "lesson"} up`} disabled={busy || lessonIndex === 0} onClick={() => reorderLesson(section, lessonIndex, -1)}>↑</button><button type="button" className={lightBtn} aria-label={`Move ${lesson.title || "lesson"} down`} disabled={busy || lessonIndex === lessons.length - 1} onClick={() => reorderLesson(section, lessonIndex, 1)}>↓</button><button type="button" className={lightBtn} onClick={() => setLessonForm({ sectionId: recordId(section), current: lesson })}>Edit</button><button type="button" className={dangerBtn} disabled={busy} onClick={() => setConfirmation({ type: "lesson", item: lesson })}>Remove</button></div></div>)}</div><button type="button" className={`${lightBtn} mt-4`} onClick={() => setLessonForm({ sectionId: recordId(section), current: null })}>+ Add lesson</button>{lessonForm?.sectionId === recordId(section) && <LessonEditor courseId={courseId} sections={sections} sectionId={recordId(section)} current={lessonForm.current} close={() => setLessonForm(null)} saved={async () => refresh(lessonForm.current ? "Lesson updated." : "Lesson created.")} />}</article>; })}</section>{sectionForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={saveSection}><h3 className="text-lg font-semibold text-[#263e30]">{sectionForm.id ? "Edit section" : "Add section"}</h3><label className={`${label} mt-4`}>Section title<input className={input} value={sectionForm.title} onChange={(event) => setSectionForm({ ...sectionForm, title: event.target.value })} /></label><div className="mt-5 flex justify-end gap-2"><button type="button" className={lightBtn} onClick={() => setSectionForm(null)}>Cancel</button><button className={btn} disabled={busy}>{busy ? "Saving..." : "Save section"}</button></div></form></div>}{confirmation && <Confirm title={`Remove ${confirmation.type}`} message={`Remove “${confirmation.item.title || "this item"}”? This updates the course curriculum and cannot be undone from the workspace.`} confirm="Remove" danger={true} busy={busy} onClose={() => setConfirmation(null)} onConfirm={async () => { const item = confirmation.item; setConfirmation(null); await (confirmation.type === "section" ? removeSection(item) : removeLesson(item)); }} />}</div>;
}
