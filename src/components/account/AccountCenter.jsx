"use client";

import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import { accountFetch } from "@/lib/client-account";
import AddressBook from "./AddressBook";
import { getCsrfToken } from "@/lib/client-account";
import DashboardSnapshot from "@/components/account/DashboardSnapshot";
import DashboardShell from "@/components/account/DashboardShell";

function toList(value, keys) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

function AccountNav({ section }) {
  return <nav className="mt-6 -mx-5 flex gap-1 overflow-x-auto border-b border-[#dfe7dd] px-5 sm:-mx-8 sm:px-8" aria-label="Account sections">{[["Overview", "/profile"], ["My courses", "/profile/courses"], ["Digital library", "/profile/digital-library"], ["Meditations", "/profile/meditations"], ["Questions", "/profile/questions"], ["Reviews", "/profile/reviews"], ["Facilitator", "/become-a-facilitator"], ["Addresses", "/profile/addresses"], ["Badges", "/profile/badges"], ["Certificates", "/profile/certificates"]].map(([label, href]) => { const active = section === href.split("/").at(-1) || href === "/profile" && section === "overview"; return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm transition ${active ? "border-[#315a48] font-semibold text-[#234d3c]" : "border-transparent text-[#647368] hover:border-[#cbd8cb] hover:text-[#234d3c]"}`}>{label}</Link>; })}</nav>;
}

export default function AccountCenter({ section = "overview" }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");


  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const me = await accountFetch("me");
      setUser(me.data || me.user || null);
      
      if (section === "badges") { const result = await accountFetch("me/badges"); setItems(toList(result.data, ["badges", "items"])); }
      if (section === "certificates") { const result = await accountFetch("me/certificates"); setItems(toList(result.data, ["certificates", "items"])); }
    } catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function logout() {
    try { const response = await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": getCsrfToken() } }); if (!response.ok) throw new Error("Sign out failed. Please try again."); clearSession(); router.push("/auth/login"); router.refresh(); } catch (caught) { setError(caught.message); }
  }

  const shownUser = user;
  const displayName = shownUser?.name || shownUser?.email?.split("@")[0] || "Your account";
  const firstName = displayName.split(" ")[0];
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  if (!busy && error.includes("sign in") && !shownUser) return <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-16 text-[#29473c]"><h1 className="font-[Georgia,serif] text-4xl">Sign in to your account</h1><p className="mt-4">Your account details, addresses, cart, badges, and certificates are available after sign in.</p><Link className="mt-6 inline-block rounded bg-[#315a48] px-5 py-3 text-white" href="/auth/login">Sign in</Link></main>;

  if (section === "overview") return <DashboardShell user={shownUser} busy={busy} error={error} logout={logout} retry={() => void load()}>{!busy && !error && <DashboardSnapshot key={shownUser?.id || shownUser?.email} />}</DashboardShell>;

  return <main className="min-h-[70vh] bg-[#fffefb] px-5 py-12 text-[#29473c] sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-5 border-b border-[#dfe7dd] pb-5"><div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8efe5] font-[Georgia,serif] text-xl text-[#234d3c]">{initials || "A"}</span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]">My Awaken</p><h1 className="mt-1 truncate font-[Georgia,serif] text-3xl text-[#17372d] sm:text-4xl">{section === "overview" ? `Welcome, ${firstName}` : section[0].toUpperCase() + section.slice(1)}</h1>{shownUser?.email && <p className="mt-1 truncate text-sm text-[#647368]">{shownUser.email}</p>}</div></div>{shownUser && <button type="button" onClick={logout} className="min-h-11 rounded-md border border-[#315a48] px-4 text-sm font-semibold text-[#315a48] transition hover:bg-[#edf3ec]">Log out</button>}</header>
    <AccountNav section={section} />
    <nav aria-label="More account sections" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">{[["Profile details", "/profile/details"], ["Membership", "/profile/membership"], ["Notifications", "/profile/notifications"], ["Sessions", "/profile/sessions"], ["Quizzes", "/profile/quizzes"], ["Orders", "/profile/orders"], ["Payments", "/profile/payments"], ["Refunds", "/profile/refunds"]].map(([label, href]) => <Link key={href} href={href} className="font-semibold text-[#315a48] underline-offset-4 hover:underline">{label}</Link>)}</nav>
    {error && <p role="alert" className="mt-6 rounded bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]">{error}</p>}{notice && <p role="status" className="mt-6 rounded bg-[#edf5ed] p-4 text-sm text-[#315a48]">{notice}</p>}{busy && <p className="mt-8 text-sm">Loading your account…</p>}
    {!busy && !error && section === "overview" && <DashboardSnapshot />}
    {!busy && !error && section === "overview" && <div className="mt-8 grid gap-4 sm:grid-cols-2">{[["Digital library", "Open and download your digital resources.", "/profile/digital-library"], ["My courses", "Continue lessons and view your progress.", "/profile/courses"], ["Classes", "Browse classes and manage a registration from its details.", "/classes"], ["My meditations", "Open meditation content and resources.", "/profile/meditations"], ["Questions", "See questions from your lessons.", "/profile/questions"], ["Reviews", "Manage your course feedback.", "/profile/reviews"], ["Facilitator application", "Apply or update your application.", "/become-a-facilitator"], ["Addresses", "Manage saved delivery and contact addresses.", "/profile/addresses"], ["Badges", "View badges earned through Awaken.", "/profile/badges"], ["Certificates", "View and download your certificates.", "/profile/certificates"], ["Your cart", "Review items saved in your account cart.", "/cart"]].map(([title, description, href]) => <Link key={href} href={href} className="rounded-xl border border-[#dfe7dd] bg-white p-6 hover:bg-[#f7faf5]"><strong className="font-[Georgia,serif] text-2xl">{title}</strong><p className="mt-2 text-sm leading-6 text-[#647368]">{description}</p></Link>)}</div>}
    {!busy && section === "addresses" && <AddressBook />}
    {!busy && !error && section === "badges" && (items.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{items.map((badge) => <article key={badge.id || badge.slug || badge.name} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><RecordMedia record={badge.badge || badge} compact imagesOnly /><RecordDetails record={badge} /><h2 className="font-[Georgia,serif] text-2xl">{badge.title || badge.name || badge.label || "Awaken badge"}</h2>{(badge.description || badge.earnedAt) && <p className="mt-3 text-sm leading-6 text-[#647368]">{badge.description || `Earned ${new Date(badge.earnedAt).toLocaleDateString("en-IN")}`}</p>}</article>)}</div> : <p className="mt-8 rounded-lg bg-white p-5 text-sm text-[#647368]">No badges to display yet.</p>)}
    {!busy && !error && section === "certificates" && (items.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{items.map((certificate) => <article key={certificate.id} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><RecordDetails record={certificate} /><h2 className="font-[Georgia,serif] text-2xl">{certificate.title || certificate.courseTitle || certificate.classTitle || "Certificate"}</h2>{certificate.issuedAt && <p className="mt-2 text-sm text-[#647368]">Issued {new Date(certificate.issuedAt).toLocaleDateString("en-IN")}</p>}<p className="mt-2 text-xs text-[#758075]">{certificate.verificationCode || certificate.code || ""}</p><div className="mt-4 flex gap-4 text-sm"><Link className="font-semibold text-[#315a48] underline" href={`/profile/certificates/${encodeURIComponent(certificate.id)}`}>View details</Link><a className="font-semibold text-[#315a48] underline" href={`/api/account/me/certificates/${encodeURIComponent(certificate.id)}/download`}>Download</a></div></article>)}</div> : <p className="mt-8 rounded-lg bg-white p-5 text-sm text-[#647368]">No certificates have been issued to this account yet.</p>)}
  </div></main>;
}
