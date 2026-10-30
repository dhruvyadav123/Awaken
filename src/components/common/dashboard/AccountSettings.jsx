"use client";

/* eslint-disable @next/next/no-img-element -- Profile photos are supplied by the backend profile contract. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Camera, Check, Globe2, Languages, MapPin, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react";
import { accountFetch } from "@/lib/client-account";
import { permanentMediaHref, safePermanentMediaUrl } from "@/lib/dashboard/media";
import { clearSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./WorkspaceShell";
import { useApi } from "./data";
import { Card, State, Badge } from "./Elements";
import MutationDialog from "./MutationDialog";
import { operationFor } from "@/lib/dashboard/operations";

const genderOptions = [["MALE", "Male"], ["FEMALE", "Female"], ["NON_BINARY", "Non-binary"], ["PREFER_NOT_TO_SAY", "Prefer not to say"]];
const profileFields = ["name", "phone", "dateOfBirth", "gender", "country", "state", "city", "timezone", "preferredLanguage", "avatar"];

function valueOf(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(", ");
  if (typeof value === "object") return textOf(value.name || value.title || value.label || value.value || value.url || value.path);
  return "";
}

function profileFrom(data) { return data?.profile || data?.user || data?.facilitator || data?.data?.profile || data?.data || data || {}; }
function displayName(profile, user) { return textOf(valueOf(profile, ["name", "displayName"])) || user?.name || user?.email?.split("@")[0] || "Your account"; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A"; }
function imageHref(profile) {
  const value = valueOf(profile, ["avatar", "avatarUrl", "profileImage", "profileImageUrl", "photo", "photoUrl", "image", "imageUrl"]);
  const candidate = typeof value === "object" ? value.url || value.publicPath || value.fileUrl || value.src || value.path : value;
  return safePermanentMediaUrl(candidate) ? permanentMediaHref(candidate) : "";
}
function locationOf(profile) { return [profile?.city, profile?.state, profile?.country].map(textOf).filter(Boolean).join(", "); }
function dateOf(value) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? textOf(value) : new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(parsed);
}
function formFrom(profile) {
  return { name: textOf(profile?.name), phone: textOf(profile?.phone), dateOfBirth: profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "", gender: textOf(profile?.gender), country: textOf(profile?.country), state: textOf(profile?.state), city: textOf(profile?.city), timezone: textOf(profile?.timezone), preferredLanguage: textOf(profile?.preferredLanguage), avatar: textOf(valueOf(profile, ["avatar", "avatarUrl", "profileImage", "profileImageUrl", "photo", "photoUrl", "image", "imageUrl"])) };
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return <label className="ws-profile-field"><span>{label}</span><input className="ws-input" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label className="ws-profile-field"><span>{label}</span><select className="ws-input" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Not specified</option>{options.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>;
}

function Detail({ icon: Icon, label, value, formatter = textOf }) {
  return <div className="ws-profile-detail"><span className="ws-profile-detail-icon"><Icon size={16} /></span><div><dt>{label}</dt><dd>{formatter(value) || "Not added yet"}</dd></div></div>;
}

function ProfileEditor({ profile, onClose, onSaved }) {
  const [form, setForm] = useState(() => formFrom(profile));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  async function save(event) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const body = Object.fromEntries(profileFields.map((key) => [key, String(form[key] || "").trim()]));
      body.dateOfBirth = form.dateOfBirth || "";
      const result = await accountFetch("me/profile", { method: "PATCH", body });
      await onSaved(result?.message || "Profile updated successfully.");
    } catch (caught) { setError(caught.message || "We could not update your profile."); }
    finally { setWorking(false); }
  }
  return <div className="ws-dialog" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="ws-dialog-content ws-profile-editor" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"><div className="ws-profile-editor-header"><div><p className="ws-eyebrow">ACCOUNT DETAILS</p><h2 id="edit-profile-title">Edit your profile</h2><p className="ws-muted">Keep the details connected to your Awaken account current.</p></div><button type="button" className="ws-icon-button" aria-label="Close edit profile" onClick={onClose}>×</button></div><form onSubmit={save}><div className="ws-profile-form-grid"><Field label="Full name" value={form.name} onChange={change("name")} placeholder="Your full name" /><Field label="Phone number" value={form.phone} onChange={change("phone")} placeholder="Your phone number" /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={change("dateOfBirth")} /><SelectField label="Gender" value={form.gender} onChange={change("gender")} options={genderOptions} /><Field label="Country" value={form.country} onChange={change("country")} placeholder="India" /><Field label="State" value={form.state} onChange={change("state")} placeholder="Your state" /><Field label="City" value={form.city} onChange={change("city")} placeholder="Your city" /><Field label="Timezone" value={form.timezone} onChange={change("timezone")} placeholder="Asia/Kolkata" /><Field label="Preferred language" value={form.preferredLanguage} onChange={change("preferredLanguage")} placeholder="English" /><Field label="Profile photo URL" value={form.avatar} onChange={change("avatar")} placeholder="https://…" /></div>{form.avatar && <div className="ws-profile-url-preview"><Camera size={15} /> The photo will be shown from the saved avatar URL.</div>}{error && <p className="ws-alert" role="alert">{error}</p>}<div className="ws-profile-editor-actions"><button type="button" className="ws-secondary" onClick={onClose}>Cancel</button><button type="submit" className="ws-button" disabled={working}>{working ? "Saving…" : "Save changes"}</button></div></form></div></div>;
}

function UserProfile({ profile, user, onEdit }) {
  const name = displayName(profile, user); const email = textOf(valueOf(profile, ["email"])) || user?.email || ""; const location = locationOf(profile); const image = imageHref(profile); const role = textOf(valueOf(profile, ["role"])) || user?.role || "USER";
  const filled = profileFields.filter((key) => textOf(profile?.[key])).length; const completion = Math.round((filled / profileFields.length) * 100);
  return <div className="ws-profile-page"><section className="ws-profile-hero"><div className="ws-profile-hero-glow" aria-hidden="true" /><div className="ws-profile-hero-content"><div className="ws-profile-avatar">{image ? <img src={image} alt={`${name} profile`} /> : <span>{initials(name)}</span>}</div><div className="ws-profile-identity"><div className="ws-profile-kicker"><span>PERSONAL PROFILE</span><Badge status={role} /></div><h2>{name}</h2>{email && <p>{email}</p>}{location && <span className="ws-profile-location"><MapPin size={14} />{location}</span>}</div><button className="ws-button ws-profile-edit-button" type="button" onClick={onEdit}><Pencil size={15} /> Edit profile</button></div></section><div className="ws-profile-layout"><main className="ws-profile-main"><section className="ws-profile-section"><div className="ws-profile-section-heading"><div><p className="ws-eyebrow">YOUR INFORMATION</p><h2>Personal details</h2></div><span className="ws-profile-section-note">Synced with your account</span></div><dl className="ws-profile-detail-grid"><Detail icon={UserRound} label="Full name" value={name} /><Detail icon={MailIcon} label="Email address" value={email} /><Detail icon={Phone} label="Phone number" value={profile?.phone} /><Detail icon={CalendarDays} label="Date of birth" value={profile?.dateOfBirth} formatter={dateOf} /><Detail icon={UserRound} label="Gender" value={profile?.gender} formatter={(value) => textOf(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} /></dl></section><section className="ws-profile-section"><div className="ws-profile-section-heading"><div><p className="ws-eyebrow">WHERE YOU ARE</p><h2>Location & time</h2></div></div><dl className="ws-profile-detail-grid"><Detail icon={MapPin} label="City" value={profile?.city} /><Detail icon={MapPin} label="State" value={profile?.state} /><Detail icon={Globe2} label="Country" value={profile?.country} /><Detail icon={Globe2} label="Timezone" value={profile?.timezone} /></dl></section><section className="ws-profile-section"><div className="ws-profile-section-heading"><div><p className="ws-eyebrow">YOUR PREFERENCES</p><h2>Language & profile photo</h2></div></div><dl className="ws-profile-detail-grid"><Detail icon={Languages} label="Preferred language" value={profile?.preferredLanguage} /><Detail icon={Camera} label="Profile photo" value={image ? "Photo added" : "Not added yet"} /></dl></section></main><aside className="ws-profile-aside"><section className="ws-profile-completion"><div className="ws-profile-completion-top"><span>Profile completeness</span><strong>{completion}%</strong></div><div className="ws-profile-progress"><span style={{ width: `${completion}%` }} /></div><p>{completion === 100 ? "Everything is up to date." : "Add a few more details to make your account feel more like you."}</p><button type="button" className="ws-text-link" onClick={onEdit}>Complete profile <span>→</span></button></section><section className="ws-profile-aside-card"><span className="ws-profile-aside-icon"><ShieldCheck size={18} /></span><h3>Your account is protected</h3><p>Your profile details are managed through the secure account service. Changes are saved only after the backend confirms them.</p></section><section className="ws-profile-aside-card"><h3>Need to manage something else?</h3><div className="ws-profile-links"><Link href="/dashboard/user/settings">Account security <span>→</span></Link><Link href="/dashboard/user/addresses">Saved addresses <span>→</span></Link><Link href="/dashboard/user/notifications">Notifications <span>→</span></Link></div></section></aside></div></div>;
}

function MailIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>; }

export default function AccountSettings({ settings = false }) {
  const { user, role, verify } = useWorkspace(); const path = role === "facilitator" ? "facilitator/profile" : "me/profile"; const state = useApi(!settings ? path : null); const permissions = useApi(settings ? "me/permissions" : null); const [editing, setEditing] = useState(false); const [modal, setModal] = useState(null); const [notice, setNotice] = useState(""); const router = useRouter(); const profile = useMemo(() => state.data ? profileFrom(state.data) : null, [state.data]);
  async function profileSaved(message) { setNotice(message); setEditing(false); await state.reload(); await verify(); }
  return <><State {...state} retry={state.reload} />{notice && <p role="status" className="ws-notice"><Check size={16} />{notice}</p>}{!settings && profile && <UserProfile profile={profile} user={user} onEdit={() => setEditing(true)} />}{settings && <div className="ws-settings-stack"><Card title="Account security"><p className="ws-muted">Change the password for your existing account. You will sign in again after a successful change.</p><button className="ws-secondary" onClick={() => setModal({ operation: operationFor("POST", "auth/change-password"), path: "auth/change-password", title: "Change password" })}>Change password</button></Card><Card title="Account access"><State {...permissions} retry={permissions.reload} /><p className="ws-muted">Verified account role: {user.role}</p><p className="ws-muted">Email verification: {user.emailVerified === true ? "Verified" : "Not verified"}</p><p className="ws-muted">Dashboard access follows your backend role and permissions.</p>{Array.isArray(permissions.data?.permissions) && <div className="ws-toolbar-actions">{permissions.data.permissions.map((permission, i) => <Badge key={typeof permission === "string" ? permission : i} status={typeof permission === "string" ? permission : permission.code || permission.name} />)}</div>}<button className="ws-secondary" onClick={verify}>Refresh account access</button></Card>{role === "user" && <Card title="Your account tools"><div className="ws-toolbar-actions"><Link className="ws-secondary" href="/dashboard/user/addresses">Manage saved addresses</Link><Link className="ws-secondary" href="/dashboard/user/membership">Membership</Link><Link className="ws-secondary" href="/dashboard/user/application">Facilitator application</Link></div></Card>}</div>}{editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSaved={profileSaved} />}{modal?.operation && <MutationDialog {...modal} onClose={() => setModal(null)} onSuccess={async () => { clearSession(); router.replace("/auth/login"); router.refresh(); }} />}</>;
}
