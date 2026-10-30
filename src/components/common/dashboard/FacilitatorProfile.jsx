"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  Check,
  CircleAlert,
  ExternalLink,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  Languages,
  Link2,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { accountFetch } from "@/lib/client-account";
import {
  mediaBinding,
  permanentMediaHref,
  safePermanentMediaUrl,
} from "@/lib/dashboard/media";
import { validateMutationBody } from "@/lib/dashboard/form-validation";
import { operationFor } from "@/lib/dashboard/operations";
import MediaPicker from "./MediaPicker";

const ENDPOINT = "facilitator/profile";
const OPERATION = operationFor("PATCH", ENDPOINT);
const SOCIALS = ["instagram", "facebook", "linkedin", "youtube", "twitter"];
const MEDIA_FIELDS = ["profileImageMediaId", "coverImageMediaId"];

const TABS = [
  { id: "basic", label: "Basic details", icon: UserRound },
  { id: "professional", label: "Professional", icon: GraduationCap },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "links", label: "Links & social", icon: Link2 },
];

const INPUT =
  "mt-1.5 w-full rounded-xl border border-[#DAE3DC] bg-white px-3.5 py-3 text-sm text-[#243C2D] outline-none transition placeholder:text-[#A2B0A5] focus:border-[#4B8060] focus:ring-4 focus:ring-[#4B8060]/10 disabled:bg-[#F5F7F5]";
const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#295840] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#204832] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDE6DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#365342] transition hover:bg-[#F4F7F4] disabled:cursor-not-allowed disabled:opacity-50";

function unwrapProfile(result) {
  const item = result?.data?.data?.profile ?? result?.data?.data ?? result?.data?.profile ?? result?.data ?? result?.profile ?? result;
  return item && typeof item === "object" && !Array.isArray(item) && item.version != null
    ? item
    : null;
}

function string(value) {
  return value == null ? "" : String(value);
}

function lines(value) {
  if (Array.isArray(value)) return value.map(string).filter(Boolean).join("\n");
  return string(value).split(",").map((v) => v.trim()).filter(Boolean).join("\n");
}

function arrayFromLines(value) {
  return [...new Set(string(value).split(/[\n,]+/).map((v) => v.trim()).filter(Boolean))];
}

function makeDraft(profile) {
  return {
    displayName: string(profile.displayName),
    shortBio: string(profile.shortBio),
    fullBio: string(profile.fullBio),
    experience: string(profile.experience),
    education: string(profile.education),
    specializations: lines(profile.specializations),
    languages: lines(profile.languages),
    certifications: lines(profile.certifications),
    city: string(profile.city),
    state: string(profile.state),
    country: string(profile.country),
    website: string(profile.website),
    socialLinks: normalizedSocials(profile.socialLinks),
  };
}

function normalizedSocials(value) {
  return Object.fromEntries(
    SOCIALS
      .map((key) => {
        const link = string(value?.[key]).trim();
        return [key, link || null];
      })
  );
}

function changesFor(profile, draft, pickedMedia) {
  if (!profile || !draft) return {};
  const changes = {};
  const simple = [
    "displayName", "shortBio", "fullBio", "experience", "education",
    "city", "state", "country", "website",
  ];

  simple.forEach((key) => {
    const next = string(draft[key]).trim();
    if (next !== string(profile[key]).trim()) changes[key] = next || (key === "displayName" ? "" : null);
  });

  ["specializations", "languages", "certifications"].forEach((key) => {
    const next = arrayFromLines(draft[key]);
    const previous = arrayFromLines(lines(profile[key]));
    if (JSON.stringify(next) !== JSON.stringify(previous)) changes[key] = next;
  });

  const social = normalizedSocials(draft.socialLinks);
  if (JSON.stringify(social) !== JSON.stringify(normalizedSocials(profile.socialLinks))) {
    changes.socialLinks = social;
  }

  MEDIA_FIELDS.forEach((mediaKey) => {
    if (pickedMedia[mediaKey] === undefined) return;
    const next = pickedMedia[mediaKey] || null;
    const previous = profile[mediaKey] || null;
    if (next !== previous) changes[mediaKey] = next;
  });

  return changes;
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validate(changes) {
  if ("displayName" in changes && !changes.displayName) {
    throw new Error("Display name cannot be empty.");
  }

  if ("website" in changes && changes.website !== null && !validHttpUrl(changes.website)) {
    throw new Error("Website needs a valid http or https URL.");
  }

  if ("socialLinks" in changes) {
    for (const [platform, url] of Object.entries(changes.socialLinks)) {
      if (url !== null && !validHttpUrl(url)) throw new Error(`${platform} needs a valid http or https URL.`);
    }
  }

  for (const key of MEDIA_FIELDS) {
    if (!(key in changes)) continue;
    const value = changes[key];
    if (value !== null && (typeof value !== "string" || !value.trim())) {
      throw new Error("Choose an image from the Media Library before saving.");
    }
    if (value !== null && !mediaBinding(OPERATION, key)) {
      throw new Error(`${key} is not supported by the profile API.`);
    }
  }
}

function publicImage(value) {
  const url = typeof value === "string"
    ? value
    : value?.publicPath || value?.url || value?.src || value?.fileUrl || "";
  if (safePermanentMediaUrl(url)) return permanentMediaHref(url);

  const mediaId = typeof value === "object" ? value?.mediaId || value?.id || value?._id : "";
  return mediaId && value?.status === "ACTIVE" && value?.visibility === "PUBLIC"
    ? `/api/public/files/media/${encodeURIComponent(mediaId)}/file`
    : "";
}

function initials(name) {
  return (string(name).trim().split(/\s+/).slice(0, 2).map((x) => x[0] || "").join("").toUpperCase() || "F");
}

function prettyDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

function FormField({ label, value, onChange, placeholder, textarea = false, rows = 3, hint, type = "text", required = false }) {
  return (
    <label className="block min-w-0 text-[13px] font-semibold text-[#334C3A]">
      <span>{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      {textarea ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${INPUT} resize-y leading-6`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={INPUT} />
      )}
      {hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-[#879688]">{hint}</span>}
    </label>
  );
}

function Tags({ values, empty = "Not added yet" }) {
  const items = arrayFromLines(lines(values));
  if (!items.length) return <span className="text-sm text-[#8D9D91]">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((value) => <span key={value} className="rounded-full border border-[#DEE9DF] bg-[#F5F9F5] px-3 py-1.5 text-xs font-medium text-[#406B4D]">{value}</span>)}
    </div>
  );
}

function Photo({ src, alt, className, placeholder }) {
  const [brokenSrc, setBrokenSrc] = useState("");
  const broken = brokenSrc === src;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {placeholder}
      {!!src && !broken && (
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" onError={() => setBrokenSrc(src)} />
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, children }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#75917C]">{eyebrow}</p>}
      <h2 className="text-xl font-semibold tracking-tight text-[#243F2D]">{children}</h2>
    </div>
  );
}

function PhotoField({ label, field, profile, selectedMedia, onSelectMedia, disabled, onMediaBusy }) {
  const mediaKey = `${field}MediaId`;
  const binding = OPERATION?.fields?.[mediaKey] ? mediaBinding(OPERATION, mediaKey) : null;
  const url = publicImage(profile[field]);
  return (
    <div className="border-b border-[#E6EDE6] pb-7 last:border-b-0 last:pb-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#2F4B38]">{label}</h3>
      </div>
      <Photo src={url} alt={label} className={`${field === "coverImage" ? "aspect-[16/6]" : "aspect-square max-w-[150px]"} mb-4 rounded-xl bg-[#EBF1EB]`} placeholder={<div className="flex h-full items-center justify-center text-[#91A695]"><ImageIcon size={28} /></div>} />
      {binding ? (
        <>
          <MediaPicker
            title={label}
            value={selectedMedia[mediaKey] ?? profile[mediaKey] ?? ""}
            previewValue={publicImage(profile[field])}
            {...binding}
            disabled={disabled}
            onBusyChange={onMediaBusy}
            onChange={(value) => onSelectMedia(mediaKey, value)}
          />
          <p className="mt-2 text-xs text-[#7C8C80]">Only active public images can be attached to a profile. Save changes after selecting an image.</p>
        </>
      ) : (
        <p className="text-sm leading-6 text-[#A23B2C]">The profile API does not support this image field right now.</p>
      )}
    </div>
  );
}

export default function FacilitatorProfile() {
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("basic");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const [pickedMedia, setPickedMedia] = useState({});
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const item = unwrapProfile(await accountFetch(ENDPOINT));
        if (!item) throw new Error("Facilitator profile was not returned by the API.");
        if (!active) return;
        setProfile(item);
        setDraft(makeDraft(item));
      } catch (err) {
        if (active) setError(err?.message || "Unable to load facilitator profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const changes = useMemo(() => changesFor(profile, draft, pickedMedia), [profile, draft, pickedMedia]);
  const dirty = Object.keys(changes).length > 0;
  const versionNumber = Number(profile?.version);
  const canEdit = profile?.version != null && String(profile.version).trim() !== "" && Number.isSafeInteger(versionNumber) && versionNumber >= 0;

  async function refresh(discardDraft = false) {
    if (lock.current) return;
    if (discardDraft && dirty && !window.confirm("Discard unsaved edits and load the latest saved profile?")) return;
    setRefreshing(true);
    setError("");
    try {
      const item = unwrapProfile(await accountFetch(ENDPOINT));
      if (!item) throw new Error("The profile API did not return profile data.");
      setProfile(item);
      if (discardDraft || !editing) {
        setDraft(makeDraft(item));
        setPickedMedia({});
        setEditing(false);
      }
      setConflict(false);
    } catch (err) {
      setError(err?.message || "Unable to refresh your profile.");
    } finally {
      setRefreshing(false);
    }
  }

  function edit(section = "basic") {
    if (!canEdit) return;
    setNotice("");
    setError("");
    setEditing(true);
    setTab(section);
  }

  function cancel() {
    if (saving || mediaBusy) return;
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setEditing(false);
    setDraft(makeDraft(profile));
    setPickedMedia({});
    setError("");
    setConflict(false);
  }

  function change(key, value) {
    setDraft((old) => ({ ...old, [key]: value }));
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    if (lock.current || !profile || !canEdit || !dirty || mediaBusy || conflict) return;
    lock.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      validate(changes);
      const body = validateMutationBody(OPERATION.fields, {
        version: Number(profile.version),
        displayName: string(draft.displayName).trim(),
        ...changes,
      });
      const result = await accountFetch(ENDPOINT, { method: OPERATION?.method || "PATCH", body });
      let latest = unwrapProfile(result);
      try {
        const fetched = unwrapProfile(await accountFetch(ENDPOINT));
        if (fetched) latest = fetched;
      } catch {
        // An accepted update may still be usable even if the follow-up GET fails.
      }
      if (!latest) {
        setNotice("Update was accepted, but the latest profile could not be loaded. Refresh before editing again.");
        setConflict(true);
        setEditing(false);
        return;
      }
      setProfile(latest);
      setDraft(makeDraft(latest));
      setPickedMedia({});
      setEditing(false);
      setConflict(false);
      setNotice("Facilitator profile updated successfully.");
    } catch (err) {
      const versionError = err?.status === 409 || /VERSION_CONFLICT|profile version|version conflict|version changed|changed on the server|stale/i.test(`${err?.code || ""} ${err?.message || ""}`);
      if (versionError) {
        setConflict(true);
        setError("Your profile was updated elsewhere. Your unsaved edits are still on this screen. Review and reload the latest version before saving again.");
      } else {
        setError(err?.message || "Profile could not be saved. Check your details and retry.");
      }
    } finally {
      setSaving(false);
      lock.current = false;
    }
  }

  if (loading) {
    return <main className="flex min-h-[65vh] items-center justify-center bg-white text-[#56705C]"><LoaderCircle className="mr-2 animate-spin" size={20} /> Loading facilitator profile...</main>;
  }
  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <CircleAlert className="mx-auto mb-3 text-red-600" />
        <h1 className="text-xl font-semibold">Unable to load profile</h1>
        <p className="mt-2 text-sm text-[#7D8D80]">{error || "No profile data was received."}</p>
        <button type="button" onClick={() => window.location.reload()} className={`${PRIMARY} mt-5`}>Try again</button>
      </main>
    );
  }

  const name = profile.displayName || "Facilitator";
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const publicHref = profile.slug && String(profile.status).toUpperCase() === "ACTIVE"
    ? `/facilitators/${encodeURIComponent(profile.slug)}` : "";

  return (
    <main className="min-h-screen bg-white pb-16 text-[#2C4433]">
      <div className="mx-auto max-w-[1160px] px-4 pt-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3 text-xs text-[#7A8C7C]">
          <span>Facilitator / <span className="font-semibold text-[#355D43]">My profile</span></span>
          <button type="button" disabled={refreshing || saving || mediaBusy} onClick={() => refresh(true)} className="inline-flex items-center gap-2 font-semibold text-[#3F6D4F] disabled:opacity-50">
            <RefreshCcw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="relative">
          <Photo
            src={publicImage(profile.coverImage)}
            alt={`${name} cover image`}
            className="h-[190px] rounded-2xl bg-[#D9E4D8] sm:h-[270px] lg:h-[310px]"
            placeholder={<div className="h-full w-full bg-gradient-to-r from-[#B8CDBB] via-[#DFE8DA] to-[#9EBEA8]" />}
          />
          {canEdit && (
            <button type="button" onClick={() => edit("photos")} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#2C583C] shadow-sm hover:bg-[#F5F8F4]">
              <Camera size={15} /> Edit photos
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 border-b border-[#E7EDE7] pb-7 sm:flex-row sm:items-end sm:gap-6">
          <Photo
            src={publicImage(profile.profileImage)}
            alt={`${name} profile photo`}
            className="-mt-12 h-[108px] w-[108px] shrink-0 rounded-full border-4 border-white bg-[#E6EEE7] sm:-mt-16 sm:h-[138px] sm:w-[138px]"
            placeholder={<div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[#4A7555]">{initials(name)}</div>}
          />
          <div className="min-w-0 flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words text-[27px] font-semibold tracking-tight text-[#23402D] sm:text-[34px]">{name}</h1>
              {profile.isVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7245]"><BadgeCheck size={17} /> Verified</span>}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#667A6A]">{profile.shortBio || "Add a short introduction to help students know you."}</p>
            {location && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#748779]"><MapPin size={14} /> {location}</p>}
          </div>
          <div className="flex flex-wrap gap-2 sm:pb-2">
            {publicHref && <Link href={publicHref} prefetch={false} target="_blank" rel="noopener noreferrer" className={SECONDARY}><ExternalLink size={15} /> Public profile</Link>}
            {canEdit && !editing && <button type="button" onClick={() => edit("basic")} className={PRIMARY}><Pencil size={15} /> Edit profile</button>}
          </div>
        </div>

        {notice && (
          <div role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-[#CFE5D1] bg-[#F1F8F1] p-3.5 text-sm text-[#316C42]">
            <Check size={18} className="shrink-0" /><span className="flex-1">{notice}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button>
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-[#F0D7D2] bg-[#FFF7F5] p-4 text-sm leading-6 text-[#A23B2C]">
            <div className="flex gap-2"><CircleAlert size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>
            {conflict && <button type="button" onClick={() => refresh(true)} disabled={refreshing} className="mt-3 font-semibold underline underline-offset-2">Reload latest profile</button>}
          </div>
        )}

        {!editing ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
            <div className="min-w-0 space-y-9">
              <section>
                <SectionTitle eyebrow="Introduction">About the facilitator</SectionTitle>
                <p className="whitespace-pre-wrap text-sm leading-8 text-[#5A705F]">{profile.fullBio || profile.shortBio || "Your introduction has not been added yet."}</p>
                {canEdit && <button type="button" onClick={() => edit("basic")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#39764C]"><Pencil size={13} /> Edit introduction</button>}
              </section>
              <div className="border-t border-[#EDF1EC]" />
              <section>
                <SectionTitle eyebrow="Expertise">Areas of specialization</SectionTitle>
                <Tags values={profile.specializations} />
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness size={17} className="text-[#629071]" /> Experience</div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#627567]">{profile.experience || "Not added yet."}</p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><GraduationCap size={18} className="text-[#629071]" /> Education</div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#627567]">{profile.education || "Not added yet."}</p>
                  </div>
                </div>
                {canEdit && <button type="button" onClick={() => edit("professional")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#39764C]"><Pencil size={13} /> Edit professional details</button>}
              </section>
              <div className="border-t border-[#EDF1EC]" />
              <section>
                <SectionTitle>Languages & certifications</SectionTitle>
                <div className="grid gap-7 sm:grid-cols-2">
                  <div><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Languages size={17} className="text-[#629071]" /> Languages</h3><Tags values={profile.languages} /></div>
                  <div><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-[#629071]" /> Certifications</h3><Tags values={profile.certifications} /></div>
                </div>
              </section>
              <div className="border-t border-[#EDF1EC]" />
              <section>
                <SectionTitle>Website & social links</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {validHttpUrl(profile.website) && <a href={profile.website} target="_blank" rel="noopener noreferrer" className={SECONDARY}><Globe2 size={16} /> Website <ExternalLink size={13} /></a>}
                  {Object.entries(profile.socialLinks || {}).filter(([, url]) => validHttpUrl(url)).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={SECONDARY}>{platform[0].toUpperCase() + platform.slice(1)} <ExternalLink size={13} /></a>
                  ))}
                  {!validHttpUrl(profile.website) && !Object.values(profile.socialLinks || {}).some(validHttpUrl) && <p className="text-sm text-[#8B9B8E]">No links have been added yet.</p>}
                </div>
                {canEdit && <button type="button" onClick={() => edit("links")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#39764C]"><Pencil size={13} /> Edit links</button>}
              </section>
            </div>
            <aside className="space-y-5">
              <div className="rounded-2xl border border-[#E7EDE6] p-5">
                <h2 className="font-semibold text-[#2D4B37]">Profile information</h2>
                <dl className="mt-4 space-y-4 text-sm">
                  <div><dt className="mb-1 text-xs text-[#8A988C]">Status</dt><dd className="font-semibold text-[#3E6848]">{profile.status || "—"}</dd></div>
                  <div><dt className="mb-1 text-xs text-[#8A988C]">Verification</dt><dd>{profile.isVerified ? "Verified" : "Not verified"}</dd></div>
                  <div><dt className="mb-1 text-xs text-[#8A988C]">Last updated</dt><dd>{prettyDate(profile.updatedAt)}</dd></div>
                  <div><dt className="mb-1 text-xs text-[#8A988C]">Profile version</dt><dd>{string(profile.version)}</dd></div>
                </dl>
              </div>
            </aside>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <nav aria-label="Edit profile sections" className="flex gap-1 overflow-x-auto border-b border-[#E5ECE5] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-6 lg:h-fit lg:flex-col lg:border-b-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${tab === id ? "bg-[#E9F2EA] text-[#275A3C]" : "text-[#718275] hover:bg-[#F4F8F4]"}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </nav>

            <form onSubmit={save} className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#7D947F]">Edit facilitator profile</p>
                  <h2 className="text-[22px] font-semibold tracking-tight text-[#294530]">{TABS.find((t) => t.id === tab)?.label}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#859687]">Only updated fields will be sent to the API.</p>
                </div>
                <button type="button" onClick={cancel} className="inline-flex items-center gap-2 text-sm font-semibold text-[#667A6B]"><ArrowLeft size={16} /> Back to profile</button>
              </div>

              {tab === "basic" && (
                <div className="space-y-5">
                  <FormField label="Display name" required value={draft.displayName} onChange={(v) => change("displayName", v)} placeholder="Full display name" />
                  <FormField label="Short introduction" value={draft.shortBio} onChange={(v) => change("shortBio", v)} textarea rows={2} placeholder="A short line about your work" hint="Shown below your name on the public profile." />
                  <FormField label="Full biography" value={draft.fullBio} onChange={(v) => change("fullBio", v)} textarea rows={6} placeholder="Tell students about your background and approach" />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="City" value={draft.city} onChange={(v) => change("city", v)} placeholder="New Delhi" />
                    <FormField label="State" value={draft.state} onChange={(v) => change("state", v)} placeholder="Delhi" />
                    <FormField label="Country" value={draft.country} onChange={(v) => change("country", v)} placeholder="India" />
                  </div>
                </div>
              )}

              {tab === "professional" && (
                <div className="space-y-5">
                  <FormField label="Teaching experience" value={draft.experience} onChange={(v) => change("experience", v)} textarea rows={3} placeholder="Your teaching and professional experience" />
                  <FormField label="Education" value={draft.education} onChange={(v) => change("education", v)} textarea rows={3} placeholder="Qualifications and education" />
                  <FormField label="Specializations" value={draft.specializations} onChange={(v) => change("specializations", v)} textarea rows={4} placeholder={"Meditation\nMindfulness\nBreathwork"} hint="One specialization per line." />
                  <FormField label="Languages" value={draft.languages} onChange={(v) => change("languages", v)} textarea rows={3} placeholder={"Hindi\nEnglish"} hint="One language per line." />
                  <FormField label="Certifications" value={draft.certifications} onChange={(v) => change("certifications", v)} textarea rows={4} placeholder={"Meditation Teacher Training\nMindfulness Training"} hint="One certification per line." />
                </div>
              )}

              {tab === "photos" && (
                <div className="space-y-7">
                  <p className="text-sm leading-6 text-[#728676]">Choose active public images from your Media Library. The selected media ID is saved to this facilitator profile.</p>
                  {[{ key: "coverImage", label: "Cover banner" }, { key: "profileImage", label: "Profile photo" }].map(({ key, label }) => (
                    <PhotoField
                      key={key}
                      label={label}
                      field={key}
                      profile={profile}
                      selectedMedia={pickedMedia}
                      onSelectMedia={(field, value) => setPickedMedia((old) => ({ ...old, [field]: value }))}
                      disabled={saving}
                      onMediaBusy={setMediaBusy}
                    />
                  ))}
                </div>
              )}

              {tab === "links" && (
                <div className="space-y-5">
                  <FormField label="Website" type="url" value={draft.website} onChange={(v) => change("website", v)} placeholder="https://example.org" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    {SOCIALS.map((platform) => (
                      <FormField
                        key={platform}
                        label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                        type="url"
                        value={string(draft.socialLinks[platform])}
                        onChange={(value) => change("socialLinks", { ...draft.socialLinks, [platform]: value })}
                        placeholder="https://"
                      />
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-[#859687]">Leave an existing social URL empty to remove it when saving.</p>
                </div>
              )}

              {error && (
                <div role="alert" className="mt-6 rounded-xl border border-[#F0D7D2] bg-[#FFF7F5] p-3 text-sm text-[#A23B2C]">
                  {error} {conflict && <button type="button" onClick={() => refresh(true)} className="ml-1 font-semibold underline">Reload latest profile</button>}
                </div>
              )}
              <div className="sticky bottom-0 z-10 mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4ECE5] bg-white/95 py-4 backdrop-blur">
                <span className="text-xs text-[#7A8D7D]">{dirty ? `${Object.keys(changes).length} field(s) changed` : "No unsaved changes"} · Version {profile.version}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={cancel} disabled={saving || mediaBusy} className={SECONDARY}>Cancel</button>
                  <button type="submit" disabled={!dirty || saving || mediaBusy || conflict} className={PRIMARY}>
                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
