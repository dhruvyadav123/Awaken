"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf } from "@/lib/learning-data";

const profileFields = [["displayName", "Display name"], ["shortBio", "Short bio"], ["fullBio", "Full bio"], ["experience", "Experience"], ["education", "Education"], ["specializations", "Specializations (comma separated)"], ["languages", "Languages (comma separated)"], ["certifications", "Certifications (comma separated)"], ["country", "Country"], ["state", "State"], ["city", "City"]];
const personalFields = [["legalName", "Legal name"], ["phone", "Phone"], ["dateOfBirth", "Date of birth"]];
const bankFields = [["accountHolderName", "Account holder name"], ["bankName", "Bank name"], ["accountNumber", "Account number"], ["ifscCode", "IFSC code"]];
const blank = Object.fromEntries([...profileFields, ...personalFields, ...bankFields].map(([key]) => [key, ""]));
const inputClass = "mt-2 block w-full rounded-md border border-[#cbd8cb] bg-white px-3 py-2.5";

function toForm(value) {
  const form = { ...blank };
  for (const [key] of profileFields) form[key] = Array.isArray(value?.[key]) ? value[key].join(", ") : value?.[key] ?? "";
  for (const [key] of personalFields) form[key] = value?.personalDetails?.[key] ?? "";
  for (const [key] of bankFields) form[key] = value?.bankDetails?.[key] ?? "";
  return form;
}

function toPayload(form, version) {
  const body = { version };
  for (const [key] of profileFields) body[key] = ["specializations", "languages", "certifications"].includes(key) ? form[key].split(",").map((part) => part.trim()).filter(Boolean) : form[key].trim();
  for (const [group, fields] of [["personalDetails", personalFields], ["bankDetails", bankFields]]) {
    const value = Object.fromEntries(fields.filter(([key]) => form[key].trim()).map(([key]) => [key, form[key].trim()]));
    if (Object.keys(value).length) body[group] = value;
  }
  return body;
}

export default function FacilitatorApplication() {
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kind, setKind] = useState("IDENTITY");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountFetch("me/facilitator-application");
      const value = dataOf(result);
      const current = value?.application || value;
      setApplication(current?.id || current?.version != null ? current : null);
      setForm(toForm(current)); setError("");
    } catch (caught) {
      if (caught.status === 404) { setApplication(null); setError(""); }
      else setError(caught.message);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function save(event) {
    event.preventDefault(); setWorking("save"); setError(""); setNotice("");
    try {
      const result = await accountFetch("me/facilitator-application", { method: application ? "PATCH" : "POST", body: application ? toPayload(form, application.version) : { displayName: form.displayName.trim() } });
      setNotice(result.message || (application ? "Application updated." : "Application created. Add your details below."));
      await load();
    } catch (caught) { setError(caught.message); }
    finally { setWorking(""); }
  }

  async function upload(event) {
    event.preventDefault();
    if (application?.version == null || !file) return;
    const formElement = event.currentTarget;
    setWorking("upload"); setError(""); setNotice("");
    try {
      const body = new FormData();
      body.set("version", String(application.version)); body.set("kind", kind); body.set("title", title.trim()); body.set("file", file);
      const result = await accountFetch("me/facilitator-application/documents", { method: "POST", body });
      setNotice(result.message || "Document uploaded."); setFile(null); setTitle("");
      formElement.reset(); await load();
    } catch (caught) { setError(caught.message); }
    finally { setWorking(""); }
  }

  async function removeDocument(id) {
    if (!window.confirm("Remove this document from your application?")) return;
    setWorking(`delete-${id}`); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/facilitator-application/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
      setNotice(result.message || "Document removed."); await load();
    } catch (caught) { setError(caught.message); }
    finally { setWorking(""); }
  }

  const documents = listOf(application, ["documents", "files"]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const renderFields = (fields) => fields.map(([key, label]) => <label key={key} className={`text-sm ${["shortBio", "fullBio", "experience", "education"].includes(key) ? "sm:col-span-2" : ""}`}>{label}{["shortBio", "fullBio", "experience", "education"].includes(key) ? <textarea value={form[key]} onChange={(event) => change(key, event.target.value)} className={`${inputClass} min-h-24`} /> : <input required={key === "displayName"} type={key === "dateOfBirth" ? "date" : "text"} autoComplete={bankFields.some(([name]) => name === key) ? "off" : undefined} value={form[key]} onChange={(event) => change(key, event.target.value)} className={inputClass} />}</label>);

  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/facilitators" className="text-sm font-semibold text-[#315a48] underline">← Meet the facilitators</Link>
    <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Facilitator application</p><h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">Share your practice with Awaken</h1><p className="mt-5 max-w-3xl leading-8 text-[#647368]">Create an application, describe your teaching experience, and attach supporting documents.</p>
    {loading && <p className="mt-8" role="status">Loading application…</p>}
    {error && <p className="mt-8 rounded-lg bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/auth/login" className="underline">Sign in</Link></>}</p>}
    {notice && <p className="mt-8 rounded-lg bg-[#edf5ed] p-4 text-sm" role="status">{notice}</p>}
    {!loading && <>
      {application?.status && <p className="mt-6 text-sm">Application status: <strong>{String(application.status).replaceAll("_", " ")}</strong></p>}
      <form onSubmit={save} className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6 sm:p-8"><h2 className="font-[Georgia,serif] text-2xl">{application ? "Your application" : "Start your application"}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{renderFields(application ? profileFields : profileFields.slice(0, 1))}</div>
        {application && <><h3 className="mt-8 font-[Georgia,serif] text-xl">Personal details</h3><div className="mt-4 grid gap-5 sm:grid-cols-2">{renderFields(personalFields)}</div><h3 className="mt-8 font-[Georgia,serif] text-xl">Bank details</h3><p className="mt-2 text-xs text-[#647368]">Enter these only if requested for your application.</p><div className="mt-4 grid gap-5 sm:grid-cols-2">{renderFields(bankFields)}</div></>}
        <button type="submit" disabled={Boolean(working) || !form.displayName.trim() || (application && application.version == null)} className="mt-8 rounded-md bg-[#315a48] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{working === "save" ? "Saving…" : application ? "Save application" : "Create application"}</button>
      </form>
      {application && <section className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6 sm:p-8"><h2 className="font-[Georgia,serif] text-2xl">Supporting documents</h2><p className="mt-2 text-sm text-[#647368]">Upload identity, certification, or other supporting files.</p>
        {documents.length > 0 && <div className="mt-5 grid gap-3">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#dfe7dd] p-4"><span className="text-sm font-semibold">{document.title || document.kind || "Document"}</span><div className="flex gap-4 text-sm"><a href={`/api/account/me/facilitator-application/documents/${encodeURIComponent(document.id)}/download`} className="text-[#315a48] underline">Download</a><button type="button" disabled={Boolean(working)} onClick={() => removeDocument(document.id)} className="text-[#8a4c3c] underline">{working === `delete-${document.id}` ? "Removing…" : "Remove"}</button></div></div>)}</div>}
        <form onSubmit={upload} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm">Document kind<input required maxLength={50} value={kind} onChange={(event) => setKind(event.target.value.toUpperCase())} className={inputClass} /></label><label className="text-sm">Document title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label><label className="text-sm sm:col-span-2">File<input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} className={inputClass} /></label><button type="submit" disabled={Boolean(working) || !file || !kind.trim() || !title.trim() || application.version == null} className="rounded-md bg-[#315a48] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{working === "upload" ? "Uploading…" : "Upload document"}</button></form>
      </section>}
    </>}
  </div></main>;
}
