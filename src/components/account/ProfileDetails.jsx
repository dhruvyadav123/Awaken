"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf } from "@/lib/learning-data";

const fields = [["name", "Name"], ["phone", "Phone"], ["dateOfBirth", "Date of birth"], ["gender", "Gender"], ["country", "Country"], ["state", "State"], ["city", "City"], ["timezone", "Time zone"], ["preferredLanguage", "Preferred language"]];

export default function ProfileDetails() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const [user, access] = await Promise.allSettled([accountFetch("me/profile"), accountFetch("me/permissions")]);
    if (user.status === "fulfilled") {
      const value = dataOf(user.value);
      setProfile(value); setForm(Object.fromEntries(fields.map(([key]) => [key, key === "dateOfBirth" ? String(value?.[key] || "").slice(0, 10) : value?.[key] ?? ""]))); setError("");
    } else setError(user.reason.message);
    if (access.status === "fulfilled") setPermissions(dataOf(access.value));
    setLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function save(event) {
    event.preventDefault();
    const changes = Object.fromEntries(fields.filter(([key]) => key === "name" && String(form[key] ?? "").trim() !== String(profile?.[key] ?? "")).map(([key]) => [key, String(form[key] || "").trim()]));
    if (!Object.keys(changes).length) { setNotice("No changes to save."); return; }
    setWorking(true); setError(""); setNotice("");
    try { const result = await accountFetch("me/profile", { method: "PATCH", body: changes }); setNotice(result.message || "Profile updated."); await load(); }
    catch (caught) { setError(caught.message); }
    finally { setWorking(false); }
  }
  const granted = listOf(permissions, ["permissions"]);
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href="/profile" className="text-sm font-semibold text-[#315a48] underline">← My account</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">Profile details</h1>
    {loading && <p className="mt-6" role="status">Loading profile…</p>}{error && <p className="mt-6 text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 text-[#315a48]" role="status">{notice}</p>}
    {!loading && profile && <><form onSubmit={save} className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><p className="text-sm text-[#647368]">{profile.email}{profile.emailVerified ? " · Verified" : " · Email not verified"}</p><p className="mt-3 text-sm text-[#647368]">You can update your name. Other profile fields show your account details.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="text-sm">{label}<input readOnly={key !== "name"} required={key === "name"} type={key === "dateOfBirth" ? "date" : "text"} value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 block w-full rounded border border-[#cbd8cb] p-3" /></label>)}</div><button disabled={working} className="mt-6 rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Saving…" : "Save profile"}</button></form>
      {permissions && <section className="mt-6 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Account permissions</h2><p className="mt-2 text-sm text-[#647368]">Role: {permissions.role || profile.role || "User"}</p>{granted.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{granted.map((item) => <li key={item} className="rounded-full bg-[#edf3ec] px-3 py-1 text-xs text-[#315a48]">{item}</li>)}</ul>}</section>}
    </>}
  </div></main>;
}
