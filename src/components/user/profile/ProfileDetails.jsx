"use client";

/* eslint-disable @next/next/no-img-element -- The avatar URL is supplied by the account profile API. */
import Link from "next/link";
import { ArrowLeft, Camera, Check, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { accountFetch } from "@/lib/client-account";
import { permanentMediaHref, safePermanentMediaUrl } from "@/lib/dashboard/media";
import { dataOf, listOf } from "@/lib/learning-data";

const genderOptions = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"];
const languageOptions = [["en", "English"], ["hi", "Hindi"]];

function initials(name = "Your profile") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";
}

function avatarUrl(value) {
  return safePermanentMediaUrl(value) ? permanentMediaHref(value) : "";
}

function normaliseProfile(value) {
  return {
    name: value?.name ?? "",
    phone: value?.phone ?? "",
    dateOfBirth: String(value?.dateOfBirth || "").slice(0, 10),
    gender: value?.gender ?? "",
    country: value?.country ?? "",
    state: value?.state ?? "",
    city: value?.city ?? "",
    timezone: value?.timezone ?? "",
    preferredLanguage: value?.preferredLanguage ?? "",
    avatar: value?.avatar ?? "",
  };
}

function TextField({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return <label className="block text-sm font-medium text-[#466052]">{label}
    <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-[#d7e1d8] bg-[#fbfdfb] px-4 py-3 text-sm text-[#234d3c] outline-none transition placeholder:text-[#9aa89d] focus:border-[#6d9b78] focus:ring-4 focus:ring-[#dfeee0]" />
  </label>;
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return <label className="block text-sm font-medium text-[#466052]">{label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-[#d7e1d8] bg-[#fbfdfb] px-4 py-3 text-sm text-[#234d3c] outline-none transition focus:border-[#6d9b78] focus:ring-4 focus:ring-[#dfeee0]">
      <option value="">{placeholder}</option>
      {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
    </select>
  </label>;
}

export default function ProfileDetails() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(normaliseProfile());
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [user, access] = await Promise.allSettled([accountFetch("me/profile"), accountFetch("me/permissions")]);
    if (user.status === "fulfilled") {
      const value = dataOf(user.value);
      setProfile(value);
      setForm(normaliseProfile(value));
    } else {
      setError(user.reason.message);
    }
    if (access.status === "fulfilled") setPermissions(dataOf(access.value));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const preview = useMemo(() => avatarUrl(form.avatar), [form.avatar]);
  const languageChoices = form.preferredLanguage && !languageOptions.some(([value]) => value === form.preferredLanguage)
    ? [[form.preferredLanguage, form.preferredLanguage], ...languageOptions]
    : languageOptions;
  const genderChoices = form.gender && !genderOptions.includes(form.gender)
    ? [[form.gender, form.gender], ...genderOptions.map((value) => [value, value.replaceAll("_", " ")])]
    : genderOptions.map((value) => [value, value.replaceAll("_", " ")]);
  const location = [form.city, form.state, form.country].filter(Boolean).join(", ");

  async function save(event) {
    event.preventDefault();
    const body = {
      name: String(form.name || "").trim(),
      phone: String(form.phone || "").trim(),
      dateOfBirth: form.dateOfBirth || "",
      gender: form.gender || "",
      country: String(form.country || "").trim(),
      state: String(form.state || "").trim(),
      city: String(form.city || "").trim(),
      timezone: String(form.timezone || "").trim(),
      preferredLanguage: String(form.preferredLanguage || "").trim(),
      avatar: String(form.avatar || "").trim(),
    };
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const result = await accountFetch("me/profile", { method: "PATCH", body });
      setNotice(result.message || "Profile updated successfully.");
      await load();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setWorking(false);
    }
  }

  const granted = listOf(permissions, ["permissions"]);
  const displayName = profile?.name || form.name || "Your profile";

  return <main className="min-h-[70vh] bg-[#f7f8f3] px-5 py-10 text-[#29473c] sm:px-8 sm:py-14">
    <div className="mx-auto max-w-5xl">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a48] hover:underline"><ArrowLeft size={16} /> My account</Link>
      <header className="mt-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#75917a]">Account settings</p><h1 className="mt-3 font-[Georgia,serif] text-4xl tracking-tight text-[#17372d] sm:text-5xl">Your profile</h1><p className="mt-4 text-sm leading-7 text-[#647368]">Keep your personal details current so Awaken can personalise your account and communication.</p></header>

      {loading && <p className="mt-8 text-sm" role="status">Loading your profile…</p>}
      {error && <p className="mt-8 rounded-xl border border-[#efd8cf] bg-[#fff6f2] p-4 text-sm text-[#8a4c3c]" role="alert">{error}</p>}
      {notice && <p className="mt-8 flex items-center gap-2 rounded-xl border border-[#d2e6d2] bg-[#f0f8ef] p-4 text-sm text-[#315a48]" role="status"><Check size={17} />{notice}</p>}

      {!loading && profile && <>
        <form onSubmit={save} className="mt-8 overflow-hidden rounded-2xl border border-[#dfe7dd] bg-white shadow-[0_14px_35px_rgba(40,84,62,.05)]">
          <div className="border-b border-[#e6eee5] bg-gradient-to-br from-[#edf5ec] via-white to-[#f8fbf6] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#dfeee0] font-[Georgia,serif] text-3xl text-[#315a48] shadow-[0_5px_18px_rgba(40,84,62,.12)]">{preview ? <img src={preview} alt={`${displayName} avatar`} className="h-full w-full object-cover" /> : <span>{initials(displayName)}</span>}</div>
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#769279]">Personal profile</p><h2 className="mt-2 font-[Georgia,serif] text-3xl text-[#17372d]">{displayName}</h2><p className="mt-2 text-sm text-[#647368]">{location || "Add your location"}</p></div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <section><div className="mb-5"><h2 className="font-[Georgia,serif] text-2xl text-[#234d3c]">Basic information</h2><p className="mt-1 text-sm text-[#718079]">These details identify you in your Awaken account.</p></div><div className="grid gap-5 sm:grid-cols-2"><TextField label="Full name" value={form.name} onChange={setField("name")} placeholder="Your full name" required /><TextField label="Phone number" value={form.phone} onChange={setField("phone")} placeholder="e.g. 9179790800" /><TextField label="Date of birth" type="date" value={form.dateOfBirth} onChange={setField("dateOfBirth")} /><SelectField label="Gender" value={form.gender} onChange={setField("gender")} options={genderChoices} placeholder="Select gender" /></div></section>
            <section className="border-t border-[#e6eee5] pt-8"><div className="mb-5"><h2 className="font-[Georgia,serif] text-2xl text-[#234d3c]">Location</h2><p className="mt-1 text-sm text-[#718079]">Use the place and timezone where you usually live.</p></div><div className="grid gap-5 sm:grid-cols-2"><TextField label="Country" value={form.country} onChange={setField("country")} placeholder="India" /><TextField label="State" value={form.state} onChange={setField("state")} placeholder="Uttar Pradesh" /><TextField label="City" value={form.city} onChange={setField("city")} placeholder="Mirzapur" /><TextField label="Timezone" value={form.timezone} onChange={setField("timezone")} placeholder="Asia/Kolkata" /></div>{location && <p className="mt-4 flex items-center gap-2 text-xs text-[#5c7b63]"><MapPin size={14} /> {location}</p>}</section>
            <section className="border-t border-[#e6eee5] pt-8"><div className="mb-5"><h2 className="font-[Georgia,serif] text-2xl text-[#234d3c]">Preferences</h2><p className="mt-1 text-sm text-[#718079]">Choose how your account content should be presented.</p></div><div className="grid gap-5 sm:grid-cols-2"><SelectField label="Preferred language" value={form.preferredLanguage} onChange={setField("preferredLanguage")} options={languageChoices} placeholder="Select language" /><TextField label="Avatar URL" value={form.avatar} onChange={setField("avatar")} placeholder="https://…" /></div>{form.avatar && !preview && <p className="mt-3 text-xs text-[#9a6758]">This avatar URL could not be previewed, but the value will be sent to your profile API.</p>}{preview && <p className="mt-3 flex items-center gap-2 text-xs text-[#5c7b63]"><Camera size={14} /> Avatar preview loaded from your saved URL.</p>}</section>
            <div className="flex flex-col-reverse gap-3 border-t border-[#e6eee5] pt-7 sm:flex-row sm:justify-end"><Link href="/profile" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cbdccc] px-6 text-sm font-semibold text-[#315a48] hover:bg-[#f3f8f2]">Cancel</Link><button disabled={working} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#315a48] px-7 text-sm font-semibold text-white transition hover:bg-[#234d3c] disabled:cursor-not-allowed disabled:opacity-50">{working ? "Saving…" : "Save profile"}</button></div>
          </div>
        </form>

        {permissions && <section className="mt-6 rounded-2xl border border-[#dfe7dd] bg-white p-6 sm:p-8"><h2 className="font-[Georgia,serif] text-2xl text-[#234d3c]">Account permissions</h2><p className="mt-2 text-sm text-[#647368]">Role: {permissions.role || profile.role || "User"}</p>{granted.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{granted.map((item) => <li key={item} className="rounded-full bg-[#edf3ec] px-3 py-1.5 text-xs text-[#315a48]">{item}</li>)}</ul>}</section>}
      </>}
    </div>
  </main>;
}
