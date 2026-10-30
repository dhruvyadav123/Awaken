"use client";

import { useEffect, useRef, useState } from "react";
import { accountFetch, getCsrfToken } from "@/lib/client-account";
import { useWorkspace } from "./WorkspaceShell";
import { useApi, rowsOf, idOf, date } from "./data";
import { State, Card, Badge } from "./Elements";
import { applicationEditable } from "@/lib/student-flow";

const steps = ["Create", "Personal details", "Documents", "Review", "Submit", "Application status"];
const professional = ["displayName", "shortBio", "fullBio", "experience", "education", "specializations", "languages", "certifications", "country", "state", "city"];
const profileIdentity = ["displayName", "shortBio", "fullBio"];
const practiceDetails = ["experience", "education"];
const expertiseDetails = ["specializations", "languages", "certifications"];
const locationDetails = ["country", "state", "city"];
const personal = ["legalName", "phone", "dateOfBirth"];
const bank = ["accountHolderName", "bankName", "accountNumber", "ifscCode"];

const fieldMeta = {
  displayName: { label: "Public name", placeholder: "How students should see your name", hint: "This name will appear on your public facilitator profile." },
  shortBio: { label: "Short introduction", placeholder: "A warm one-line introduction about your practice", hint: "Keep it clear and welcoming. It appears beneath your name." },
  fullBio: { label: "About your practice", placeholder: "Tell students about your approach, background and what they can expect", hint: "Share the story and perspective behind the work you offer." },
  experience: { label: "Teaching experience", placeholder: "Years of experience, communities served, or practices taught" },
  education: { label: "Education and training", placeholder: "Relevant education, teacher trainings or professional qualifications" },
  specializations: { label: "Areas of specialization", placeholder: "Meditation\nMindfulness\nBreathwork", hint: "Add one specialization per line." },
  languages: { label: "Languages", placeholder: "Hindi\nEnglish", hint: "Add one language per line." },
  certifications: { label: "Certifications", placeholder: "Meditation Teacher Training\nMindfulness Training", hint: "Add one certification per line." },
  country: { label: "Country", placeholder: "India" },
  state: { label: "State", placeholder: "Maharashtra" },
  city: { label: "City", placeholder: "Mumbai" },
  legalName: { label: "Legal name", placeholder: "Your full legal name" },
  phone: { label: "Phone number", placeholder: "+91 98765 43210" },
  dateOfBirth: { label: "Date of birth", hint: "Used only where required for application verification." },
  accountHolderName: { label: "Account holder name", placeholder: "Name as shown on your bank account" },
  bankName: { label: "Bank name", placeholder: "Your bank name" },
  accountNumber: { label: "Account number", placeholder: "Re-enter account number to update it" },
  ifscCode: { label: "IFSC / routing code", placeholder: "e.g. HDFC0001234" },
};

const label = (key) => fieldMeta[key]?.label || key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());

function toForm(application) {
  const value = {};
  for (const key of professional) value[key] = Array.isArray(application?.[key]) ? application[key].join("\n") : application?.[key] || "";
  for (const [group, fields] of [["personalDetails", personal], ["bankDetails", bank]]) {
    for (const key of fields) value[`${group}.${key}`] = key === "dateOfBirth" ? String(application?.[group]?.[key] || "").slice(0, 10) : key === "accountNumber" && /[*?]/.test(application?.[group]?.[key] || "") ? "" : application?.[group]?.[key] || "";
  }
  return value;
}

export default function ApplicationWizard() {
  const { verify } = useWorkspace();
  const state = useApi("me/facilitator-application");
  const application = state.data?.application || state.data;
  const exists = Boolean(idOf(application) || application?.version != null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const [kind, setKind] = useState("IDENTITY");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!application) return undefined;
    const timer = setTimeout(() => setForm(toForm(application)), 0);
    return () => clearTimeout(timer);
  }, [application]);

  async function act(name, run, next) {
    if (lock.current) return;
    lock.current = true;
    setWorking(name);
    setError("");
    setNotice("");
    try {
      const result = await run();
      setNotice(result?.message || "Application updated successfully.");
      await state.reload();
      if (next != null) setStep(next);
    } catch (caught) {
      setError(caught.status === 409 ? `${caught.message} Refresh the application to load its latest version before retrying.` : caught.message);
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  async function currentVersion() {
    const result = await accountFetch("me/facilitator-application");
    const value = result.data?.application || result.data;
    if (value?.version == null) throw new Error("The current application version is unavailable. Refresh and try again.");
    return value.version;
  }

  async function checkAccess() {
    if (lock.current) return;
    lock.current = true;
    setWorking("access");
    setError("");
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST", headers: { "x-csrf-token": getCsrfToken() }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("Please sign in again to refresh your account access.");
      await verify();
      setNotice("Account access refreshed.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  function save(event) {
    event.preventDefault();
    void act("save", async () => {
      const body = { version: application.version };
      for (const key of professional) body[key] = ["specializations", "languages", "certifications"].includes(key) ? String(form[key] || "").split("\n").map((item) => item.trim()).filter(Boolean) : String(form[key] || "").trim();
      for (const [group, fields] of [["personalDetails", personal], ["bankDetails", bank]]) {
        if (group === "bankDetails" && !form["bankDetails.accountNumber"]) {
          if (bank.some((key) => key !== "accountNumber" && (form[`${group}.${key}`] || "") !== (application.bankDetails?.[key] || ""))) throw new Error("Re-enter the complete account number to change bank details. Saved masked numbers are never submitted.");
          continue;
        }
        const nested = Object.fromEntries(fields.filter((key) => form[`${group}.${key}`]).map((key) => [key, form[`${group}.${key}`].trim()]));
        if (Object.keys(nested).length) body[group] = nested;
      }
      await accountFetch("me/facilitator-application", { method: "PATCH", body });
    }, 2);
  }

  function upload(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const body = new FormData(formElement);
    body.set("kind", kind);
    void act("upload", async () => {
      body.set("version", String(await currentVersion()));
      await accountFetch("me/facilitator-application/documents", { method: "POST", body });
      formElement.reset();
    });
  }

  function renderFields(keys) {
    return keys.map((key) => {
      const simple = key.split(".").at(-1);
      const meta = fieldMeta[simple] || {};
      const textArea = /Bio|experience|education|specializations|languages|certifications/.test(simple);
      const describedBy = meta.hint ? `${key.replaceAll(".", "-")}-hint` : undefined;
      return (
        <label key={key} className={`ws-field ws-application-field ${textArea ? "ws-field-full" : ""}`}>
          <span>{meta.label || label(simple)}{simple === "displayName" && <em>Required</em>}</span>
          {textArea ? <textarea className="ws-input ws-application-textarea" required={simple === "displayName"} rows={simple === "fullBio" ? 6 : 3} placeholder={meta.placeholder} aria-describedby={describedBy} value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /> : <input className="ws-input" type={simple === "dateOfBirth" ? "date" : simple === "phone" ? "tel" : "text"} required={simple === "displayName"} autoComplete={key.startsWith("bankDetails") ? "off" : undefined} placeholder={meta.placeholder} aria-describedby={describedBy} value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />}
          {meta.hint && <small id={describedBy}>{meta.hint}</small>}
        </label>
      );
    });
  }

  const documents = rowsOf(application, ["documents", "files"]);
  const busy = Boolean(working);
  const canEdit = applicationEditable(application);

  if (!state.loading && state.error && state.status !== 404) return <State error={state.error} retry={state.reload} />;

  return (
    <div className="ws-application-page">
      <section className="ws-application-hero">
        <div className="ws-application-hero-copy"><p className="ws-application-kicker">FACILITATOR APPLICATION</p><h2>Turn your practice into a meaningful learning space.</h2><p>Build a thoughtful facilitator profile so the Awaken team and future learners can understand your experience, approach and offerings.</p></div>
        <div className="ws-application-hero-meta"><span>{exists ? "Application in progress" : "New application"}</span><strong>{exists ? String(application.status || "DRAFT").replaceAll("_", " ") : "DRAFT"}</strong><small>Securely saved to your account</small></div>
      </section>
      <State loading={state.loading} error={state.status === 404 ? "" : state.error} retry={state.reload} />
      {error && <p className="ws-alert" role="alert">{error}</p>}
      {notice && <p className="ws-notice" role="status">{notice}</p>}

      <nav className="ws-steps ws-application-steps" aria-label="Application steps">{steps.map((title, index) => <button key={title} className="ws-step" aria-current={step === index ? "step" : undefined} disabled={busy || (!exists && index > 0)} onClick={() => setStep(index)}><span>{index + 1}</span><strong>{title}</strong></button>)}</nav>

      {!state.loading && step === 0 && <Card title={exists ? "Your facilitator application" : "Start your application"}>{exists ? <div className="ws-application-start"><div className="ws-application-start-icon" aria-hidden="true">✦</div><div><p className="ws-application-eyebrow">Welcome back</p><h3>Continue shaping your facilitator profile.</h3><p className="ws-muted">Your application is linked to this account. Add your details, upload supporting documents and submit when everything looks right.</p><div className="ws-application-start-actions"><button className="ws-button" onClick={() => setStep(1)}>Edit personal details</button><button className="ws-secondary" onClick={() => setStep(5)}>Check application status</button></div></div></div> : <form onSubmit={(event) => { event.preventDefault(); void act("create", () => accountFetch("me/facilitator-application", { method: "POST", body: { displayName: String(form.displayName || "").trim() } }), 1); }} className="ws-application-create"><div className="ws-application-start-icon" aria-hidden="true">01</div><div><p className="ws-application-eyebrow">First step</p><h3>Let&apos;s start with the name you want to share.</h3><p className="ws-muted">You can add the rest of your professional details after creating the application.</p><label className="ws-field ws-application-field ws-application-create-field"><span>Public name<em>Required</em></span><input className="ws-input" required minLength={2} placeholder="Your name as learners should see it" value={form.displayName || ""} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} /></label><button className="ws-button" disabled={busy}>{busy ? "Creating…" : "Create application and continue"}</button></div></form>}</Card>}

      {exists && step === 1 && <Card title="Personal details"><div className="ws-application-card-intro"><div><p className="ws-application-eyebrow">Step 2 of 6 · Your profile</p><h3>Tell people what makes your practice yours.</h3><p className="ws-muted">These details help us review your application and help learners find the right facilitator.</p></div><span className="ws-application-save-note">Save when ready</span></div>{!canEdit && <p className="ws-application-lock">This application is currently locked by its review status. You can view the details, but editing is unavailable.</p>}<form onSubmit={save} className="ws-form ws-application-form"><fieldset className="ws-application-fieldset"><legend><span>01</span> Public profile</legend><p className="ws-application-fieldset-copy">This is the first impression learners will see on your profile.</p><div className="ws-form">{renderFields(profileIdentity)}</div></fieldset><fieldset className="ws-application-fieldset"><legend><span>02</span> Practice and experience</legend><p className="ws-application-fieldset-copy">Share the background, training and areas where you can guide learners.</p><div className="ws-form">{renderFields(practiceDetails)}</div><div className="ws-form ws-application-subsection">{renderFields(expertiseDetails)}</div></fieldset><fieldset className="ws-application-fieldset"><legend><span>03</span> Location</legend><p className="ws-application-fieldset-copy">A general location helps learners understand your availability and context.</p><div className="ws-form">{renderFields(locationDetails)}</div></fieldset><fieldset className="ws-application-fieldset"><legend><span>04</span> Personal verification</legend><p className="ws-application-fieldset-copy">These details are private and used only when needed for application verification.</p><div className="ws-form">{renderFields(personal.map((key) => `personalDetails.${key}`))}</div></fieldset><fieldset className="ws-application-fieldset ws-application-sensitive"><legend><span>05</span> Payment details <small>Optional</small></legend><p className="ws-application-fieldset-copy">Provide these only if the Awaken team requests payment details for your facilitator application.</p><div className="ws-application-sensitive-note">Your saved account number is never displayed or sent back in full. Re-enter it only when you need to update bank details.</div><div className="ws-form">{renderFields(bank.map((key) => `bankDetails.${key}`))}</div></fieldset><div className="ws-application-form-actions"><button type="button" className="ws-secondary" disabled={busy} onClick={() => setStep(0)}>Back</button><button className="ws-button" disabled={busy || !canEdit}>{busy ? "Saving…" : "Save details and continue"}</button></div></form></Card>}

      {exists && step === 2 && <Card title="Supporting documents"><div className="ws-application-card-intro"><div><p className="ws-application-eyebrow">Step 3 of 6 · Verification</p><h3>Bring the important proof together.</h3><p className="ws-muted">Upload identity, certification or other supporting files that help the team review your application.</p></div><span className="ws-application-count">{documents.length} uploaded</span></div><State empty={!documents.length} title="No documents uploaded yet" description="Add a clear identity document or relevant qualification when requested." />{documents.length > 0 && <ul className="ws-list ws-application-document-list">{documents.map((document) => <li key={idOf(document)}><div className="ws-document-icon" aria-hidden="true">PDF</div><div className="ws-list-content"><h3>{document.title || document.kind}</h3><p>{document.kind || "Supporting document"}</p></div><a className="ws-secondary" href={`/api/account/me/facilitator-application/documents/${idOf(document)}/download`}>Download</a><button className="ws-secondary" disabled={busy || !canEdit} onClick={() => { if (window.confirm("Remove this supporting document?")) void act("remove", async () => accountFetch(`me/facilitator-application/documents/${idOf(document)}`, { method: "DELETE", body: { version: await currentVersion() } })); }}>Remove</button></li>)}</ul>}<form className="ws-application-upload" onSubmit={upload}><div className="ws-application-upload-heading"><span className="ws-document-icon" aria-hidden="true">+</span><div><h3>Add a supporting document</h3><p>PDF, PNG or JPG · use a clear, readable file</p></div></div><div className="ws-form"><label className="ws-field"><span>Document kind</span><input className="ws-input" required value={kind} onChange={(event) => setKind(event.target.value.toUpperCase())} /></label><label className="ws-field"><span>Document title</span><input className="ws-input" name="title" required placeholder="e.g. Meditation teacher training" /></label><label className="ws-field ws-field-full"><span>Choose file</span><input className="ws-input" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required /></label></div><div className="ws-application-form-actions"><button className="ws-button" disabled={busy || !canEdit}>{working === "upload" ? "Uploading…" : "Upload document"}</button><button className="ws-secondary" type="button" disabled={busy} onClick={() => setStep(3)}>Continue to review</button></div></form></Card>}

      {exists && step === 3 && <Card title="Review your application"><div className="ws-application-card-intro"><div><p className="ws-application-eyebrow">Step 4 of 6 · Final review</p><h3>Make sure your story feels complete.</h3><p className="ws-muted">Review the information below before you move to submission.</p></div></div><dl className="ws-review ws-application-review">{professional.map((key) => <div key={key}><dt>{label(key)}</dt><dd>{Array.isArray(application[key]) ? application[key].join(", ") : application[key] || "Not provided"}</dd></div>)}</dl><div className="ws-application-review-footer"><span>{documents.length} supporting document{documents.length === 1 ? "" : "s"} uploaded</span><div className="ws-toolbar-actions"><button className="ws-secondary" onClick={() => setStep(1)}>Edit details</button><button className="ws-button" onClick={() => setStep(4)}>Continue to submit</button></div></div></Card>}

      {exists && step === 4 && <Card title="Submit for review"><div className="ws-application-submit"><div className="ws-application-start-icon" aria-hidden="true">✓</div><div><p className="ws-application-eyebrow">Step 5 of 6 · Ready when you are</p><h3>Your application is ready for a careful review.</h3><p className="ws-muted">The Awaken team will review your details and documents. You can return to your profile later if the application needs corrections.</p><label className="ws-application-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have reviewed my application and confirm these details are accurate.</span></label><button className="ws-button" disabled={!consent || busy || !canEdit} onClick={() => void act("submit", async () => accountFetch("me/facilitator-application/submit", { method: "POST", body: { version: await currentVersion() } }), 5)}>{working === "submit" ? "Submitting…" : "Submit application"}</button></div></div></Card>}

      {exists && step === 5 && <Card title="Application status"><div className="ws-application-status"><div className="ws-application-status-head"><div><p className="ws-application-eyebrow">Step 6 of 6 · Your application</p><h3>Track your facilitator journey.</h3><p className="ws-muted">Your account access becomes active only when the backend confirms your facilitator role.</p></div><Badge status={application.status} /></div>{(application.reviewNotes || application.rejectionReason || application.feedback) && <p className="ws-alert">{String(application.reviewNotes || application.rejectionReason || application.feedback)}</p>}<div className="ws-application-status-meta"><span>Last updated</span><strong>{date(application.updatedAt)}</strong></div><div className="ws-toolbar-actions"><button className="ws-secondary" disabled={busy} onClick={state.reload}>Refresh status</button><button className="ws-button" disabled={busy} onClick={checkAccess}>{working === "access" ? "Checking…" : "Check facilitator access"}</button><button className="ws-secondary" disabled={busy || ["DRAFT", "SUBMITTED", "APPROVED"].includes(application.status)} onClick={() => void act("reopen", async () => accountFetch("me/facilitator-application/reopen", { method: "POST", body: { version: await currentVersion() } }), 1)}>{working === "reopen" ? "Reopening…" : "Reopen for corrections"}</button></div></div></Card>}
    </div>
  );
}
