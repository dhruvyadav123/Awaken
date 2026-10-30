"use client";
/* eslint-disable @next/next/no-img-element -- Course media can be a backend public URL or an authorized proxy path. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker from "../MediaPicker";
import "../course-create.css";
import { courseWrite, mediaPreviewHref, schemas } from "./course-api";
import { btn, input, label, lightBtn, Note, panel } from "./CourseUI";

const emptyDraft = {
  title: "",
  seoDescription: "",
  shortDescription: "",
  description: "",
  thumbnail: "",
  thumbnailMediaId: "",
  banner: "",
  bannerMediaId: "",
  categoryId: null,
  languageId: "",
  levelId: "",
  learningOutcomes: [""],
  requirements: [],
  regularPrice: "",
  discountPrice: "",
  currency: "INR",
  certificateEnabled: false,
  demoVideoSource: "",
  demoVideoUrl: "",
  demoVideoMediaId: "",
  completionPolicy: { requiredLessonPercent: 100, requirePassingQuizzes: false },
};

function rows(value, keys) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

function optionId(item) {
  return typeof item === "string" ? item : item?.id || item?._id || "";
}

function optionName(item) {
  return typeof item === "string" ? item : item?.name || item?.title || item?.displayName || optionId(item);
}

function draftOf(course) {
  const draft = {
    ...emptyDraft,
    ...(course || {}),
    learningOutcomes: Array.isArray(course?.learningOutcomes) && course.learningOutcomes.length ? course.learningOutcomes : [""],
    requirements: Array.isArray(course?.requirements) ? course.requirements : [],
    completionPolicy: { ...emptyDraft.completionPolicy, ...(course?.completionPolicy || {}) },
  };
  for (const key of ["title", "seoDescription", "shortDescription", "description", "thumbnail", "thumbnailMediaId", "banner", "bannerMediaId", "languageId", "levelId", "currency", "demoVideoSource", "demoVideoUrl", "demoVideoMediaId", "discountPrice"]) {
    draft[key] = typeof draft[key] === "string" ? draft[key] : "";
  }
  if (!["YOUTUBE", "UPLOAD"].includes(draft.demoVideoSource)) draft.demoVideoSource = "";
  draft.categoryId = typeof draft.categoryId === "string" && draft.categoryId ? draft.categoryId : null;
  draft.certificateEnabled = Boolean(draft.certificateEnabled);
  draft.completionPolicy.requiredLessonPercent = Number(draft.completionPolicy.requiredLessonPercent) || 100;
  draft.completionPolicy.requirePassingQuizzes = Boolean(draft.completionPolicy.requirePassingQuizzes);
  return draft;
}

function SelectField({ title, value, onChange, options, required = false, loading = false }) {
  return <label className={label}>
    {title}{required && <span className="ml-1 text-red-600">*</span>}
    <select className={input} required={required} value={value || ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">{loading ? "Loading..." : `Select ${title.toLowerCase()}`}</option>
      {options.map((item) => <option key={optionId(item)} value={optionId(item)}>{optionName(item)}</option>)}
    </select>
  </label>;
}

function ListField({ title, items, setItems, required = false }) {
  const values = items.length ? items : [""];
  return <div className="min-w-0">
    <p className={label}>{title}{required && <span className="ml-1 text-red-600">*</span>}</p>
    <div className="mt-1.5 space-y-2">
      {values.map((item, index) => <div className="flex min-w-0 gap-2" key={`${title}-${index}`}>
        <input className={input} required={required && index === 0} value={item} onChange={(event) => setItems(values.map((row, rowIndex) => rowIndex === index ? event.target.value : row))} />
        <button type="button" className={lightBtn} aria-label={`Remove ${title} ${index + 1}`} disabled={values.length === 1 && !item} onClick={() => setItems(values.filter((_, rowIndex) => rowIndex !== index))}>x</button>
      </div>)}
      <button type="button" className={lightBtn} onClick={() => setItems([...values, ""])}>+ Add</button>
    </div>
  </div>;
}

function Section({ number, title, children }) {
  return <section className={panel}>
    <h2 className="mb-3 text-lg font-semibold text-[#263e30]">{number}. {title}</h2>
    {children}
  </section>;
}

export default function CourseEditor({ initial, lookups = {}, lookupsLoading = false, lookupsError = "", onRetryLookups, onClose, onSaved }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [value, setValue] = useState(() => draftOf(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const languages = rows(lookups.languages, ["languages"]);
  const levels = rows(lookups.levels, ["levels"]);
  const previewThumbnail = mediaPreviewHref(value.thumbnail);
  const previewChips = [
    languages.find((item) => optionId(item) === value.languageId),
    levels.find((item) => optionId(item) === value.levelId),
  ].filter(Boolean).map(optionName);
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }));
  const updateMediaUrl = (key, next) => setValue((current) => ({ ...current, [key]: next, [`${key}MediaId`]: "" }));
  const selectMedia = (key, { id, href }) => setValue((current) => ({ ...current, [key]: href, [`${key}MediaId`]: id }));
  const updateDemoSource = (next) => setValue((current) => ({
    ...current,
    demoVideoSource: next,
    demoVideoUrl: next === "YOUTUBE" ? current.demoVideoUrl : "",
    demoVideoMediaId: next === "UPLOAD" ? current.demoVideoMediaId : "",
  }));
  const updateDemoUrl = (next) => setValue((current) => ({ ...current, demoVideoSource: "YOUTUBE", demoVideoUrl: next, demoVideoMediaId: "" }));
  const selectDemoVideo = ({ id }) => setValue((current) => ({ ...current, demoVideoSource: "UPLOAD", demoVideoUrl: "", demoVideoMediaId: id }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const outcomes = value.learningOutcomes.map((item) => String(item).trim()).filter(Boolean);
    const requirements = value.requirements.map((item) => String(item).trim()).filter(Boolean);
    const thumbnail = value.thumbnail.trim();
    const banner = value.banner.trim();
    const thumbnailMediaId = value.thumbnailMediaId.trim();
    const bannerMediaId = value.bannerMediaId.trim();
    const demoVideoSource = value.demoVideoSource;
    const demoVideoUrl = value.demoVideoUrl.trim();
    const demoVideoMediaId = value.demoVideoMediaId.trim();
    const regularPrice = Number(value.regularPrice);
    const discountPrice = value.discountPrice.trim() === "" ? null : Number(value.discountPrice);
    if (!outcomes.length) { setError("Add at least one learning outcome."); setBusy(false); return; }
    if (!thumbnail && !thumbnailMediaId) { setError("Select a course thumbnail or enter a public image URL."); setBusy(false); return; }
    if (!languages.length || !levels.length) { setError("Select a valid language and level. Refresh the options if needed."); setBusy(false); return; }
    if (discountPrice !== null && discountPrice > regularPrice) { setError("Discount price cannot be greater than regular price."); setBusy(false); return; }

    try {
      const payload = {
        title: value.title.trim(),
        shortDescription: value.shortDescription.trim(),
        description: value.description.trim(),
        languageId: value.languageId,
        levelId: value.levelId,
        learningOutcomes: outcomes,
        regularPrice,
        discountPrice,
        currency: value.currency.trim().toUpperCase(),
        certificateEnabled: Boolean(value.certificateEnabled),
        completionPolicy: {
          requiredLessonPercent: Number(value.completionPolicy.requiredLessonPercent) || 100,
          requirePassingQuizzes: Boolean(value.completionPolicy.requirePassingQuizzes),
        },
      };
      if (thumbnailMediaId) payload.thumbnailMediaId = thumbnailMediaId;
      else if (thumbnail || editing) payload.thumbnail = thumbnail;
      if (bannerMediaId) payload.bannerMediaId = bannerMediaId;
      else if (banner || editing) payload.banner = banner;
      if (demoVideoSource === "YOUTUBE") Object.assign(payload, {
        demoVideoSource,
        demoVideoUrl,
      });
      if (demoVideoSource === "UPLOAD" && demoVideoMediaId) Object.assign(payload, {
        demoVideoSource,
        demoVideoMediaId,
      });
      if (!demoVideoSource && editing) Object.assign(payload, {
        demoVideoSource: null,
        demoVideoUrl: "",
        demoVideoMediaId: null,
      });
      if (editing) Object.assign(payload, {
        seoDescription: value.seoDescription.trim(),
        categoryId: value.categoryId,
        requirements,
      });
      const result = await courseWrite({ method: editing ? "PATCH" : "POST", path: editing ? `facilitator/courses/${encodeURIComponent(initial.id)}` : "facilitator/courses", template: editing ? schemas.editCourse : schemas.createCourse, courseId: initial?.id, values: payload });
      const course = result.data?.course || result.data;
      setNotice(result.message || (editing ? "Course updated." : "Course created."));
      await onSaved?.(course);
      if (!editing && course?.id) router.push(`/dashboard/facilitator/courses/${encodeURIComponent(course.id)}`); else onClose?.();
    } catch (caught) {
      setError(caught.message || "Course could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102a1d]/35 p-3 backdrop-blur-sm sm:p-6">
    <section role="dialog" aria-modal="true" aria-labelledby="course-editor-title" className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#f7faf7] shadow-2xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dbe7dd] bg-white px-5 py-4 sm:px-8">
        <h1 id="course-editor-title" className="text-xl font-semibold text-[#203b2a]">{editing ? "Edit course" : "Create course"}</h1>
        <button type="button" className={lightBtn} onClick={onClose}>Close</button>
      </header>
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={submit} className="min-w-0 space-y-5">
          <Note error={error || lookupsError} success={notice} />
          {lookupsError && <button type="button" className={`${lightBtn} mb-3`} onClick={onRetryLookups}>Retry options</button>}

          <Section number="1" title="Course information">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>Course title<span className="ml-1 text-red-600">*</span><input className={input} required minLength={3} value={value.title} onChange={(event) => update("title", event.target.value)} /></label>
              <label className={`${label} sm:col-span-2`}>Short description<span className="ml-1 text-red-600">*</span><textarea className={input} required rows={2} value={value.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></label>
              <label className={`${label} sm:col-span-2`}>Full description<span className="ml-1 text-red-600">*</span><textarea className={input} required rows={4} value={value.description} onChange={(event) => update("description", event.target.value)} /></label>
              <SelectField title="Language" value={value.languageId} onChange={(next) => update("languageId", next)} options={languages} required loading={lookupsLoading} />
              <SelectField title="Level" value={value.levelId} onChange={(next) => update("levelId", next)} options={levels} required loading={lookupsLoading} />
            </div>
          </Section>

          <Section number="2" title="Course media">
            <div className="grid gap-4 lg:grid-cols-2">
              <MediaPicker title="Course thumbnail *" value={value.thumbnail} onChange={(next) => updateMediaUrl("thumbnail", next)} onSelectRecord={(record) => selectMedia("thumbnail", record)} />
              <MediaPicker title="Course banner" value={value.banner} onChange={(next) => updateMediaUrl("banner", next)} onSelectRecord={(record) => selectMedia("banner", record)} />
            </div>
          </Section>

          <Section number="3" title="Demo video">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Demo video source
                <select className={input} value={value.demoVideoSource} onChange={(event) => updateDemoSource(event.target.value)}>
                  <option value="">No demo video</option>
                  <option value="YOUTUBE">YouTube URL</option>
                  <option value="UPLOAD">Media Library video</option>
                </select>
              </label>
              {value.demoVideoSource === "YOUTUBE" && <label className={label}>
                YouTube video URL
                <input className={input} type="text" inputMode="url" value={value.demoVideoUrl} onChange={(event) => updateDemoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </label>}
              {value.demoVideoSource === "UPLOAD" && <div className="sm:col-span-2">
                <MediaPicker title="Choose demo video from Media Library" value={value.demoVideoMediaId} valueType="id" mediaKind="VIDEO" allowNonPublic onChange={(next) => update("demoVideoMediaId", next)} onSelectRecord={selectDemoVideo} />
              </div>}
            </div>
          </Section>

          <Section number="4" title="Learning outcomes">
            <ListField title="Learning outcomes" items={value.learningOutcomes} setItems={(next) => update("learningOutcomes", next)} required />
          </Section>

          <Section number="5" title="Course pricing">
            <div className="grid gap-4 sm:grid-cols-3"><label className={label}>Regular price<span className="ml-1 text-red-600">*</span><input className={input} required type="number" min="0" step="0.01" value={value.regularPrice} onChange={(event) => update("regularPrice", event.target.value)} /></label><label className={label}>Discount price<input className={input} type="number" min="0" step="0.01" value={value.discountPrice} onChange={(event) => update("discountPrice", event.target.value)} /></label><label className={label}>Currency<span className="ml-1 text-red-600">*</span><select className={input} required value={value.currency} onChange={(event) => update("currency", event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label></div>
          </Section>

          <Section number="6" title="Completion and certificate">
            <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Lessons required (%)<input className={input} type="number" min="1" max="100" step="1" value={value.completionPolicy.requiredLessonPercent} onChange={(event) => update("completionPolicy", { ...value.completionPolicy, requiredLessonPercent: event.target.value })} /></label><label className="flex items-start gap-3 rounded-lg border border-[#dbe7dd] p-3 text-sm text-[#354e40]"><input className="mt-1" type="checkbox" checked={value.completionPolicy.requirePassingQuizzes} onChange={(event) => update("completionPolicy", { ...value.completionPolicy, requirePassingQuizzes: event.target.checked })} /><b>Require passing quizzes</b></label><label className="flex items-start gap-3 rounded-lg border border-[#dbe7dd] p-3 text-sm text-[#354e40]"><input className="mt-1" type="checkbox" checked={value.certificateEnabled} onChange={(event) => update("certificateEnabled", event.target.checked)} /><b>Enable certificate</b></label></div>
          </Section>

          <section className={panel}>
            <div className="flex flex-wrap justify-end gap-3"><button type="button" className={lightBtn} disabled={busy} onClick={onClose}>Cancel</button><button className={btn} disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Create course"}</button></div>
          </section>
        </form>

        <aside className="h-fit lg:sticky lg:top-5"><div className="overflow-hidden rounded-xl border border-[#dbe7dd] bg-white shadow-sm"><div className="aspect-video bg-[#eaf2eb]">{previewThumbnail && <img src={previewThumbnail} alt="" className="h-full w-full object-cover" />}</div><div className="p-5"><div>{value.title && <h2 className="break-words text-xl font-semibold text-[#203b2a]">{value.title}</h2>}{value.shortDescription && <p className="mt-2 text-sm leading-6 text-slate-600">{value.shortDescription}</p>}</div>{previewChips.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{previewChips.map((chip) => <span key={chip} className="rounded-full bg-[#edf5ee] px-2.5 py-1 text-xs font-medium text-[#315a48]">{chip}</span>)}</div>}{value.regularPrice !== "" && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">Price</p><p className="mt-1 text-2xl font-semibold text-[#315a48]">{Number(value.discountPrice === "" ? value.regularPrice : value.discountPrice) > 0 ? `${value.currency} ${value.discountPrice === "" ? value.regularPrice : value.discountPrice}` : "Free"}</p>{value.discountPrice !== "" && <p className="mt-1 text-xs text-slate-400 line-through">{value.currency} {value.regularPrice}</p>}</div>}</div></div></aside>
      </div>
    </section>
  </div>;
}
