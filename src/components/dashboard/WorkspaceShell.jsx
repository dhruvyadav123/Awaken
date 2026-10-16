"use client";
import Link from "next/link";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { accountFetch, getCsrfToken } from "@/lib/client-account";
import { clearSession, persistSession } from "@/lib/session";
import { dashboardHome, identityOf, roleOf, canUseDashboard, facilitatorAction } from "@/lib/dashboard/identity";
import { userNavigation, facilitatorNavigation, hrefFor } from "@/lib/dashboard/navigation";
import "./workspace.css";

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);
export function Icon({ name = "grid", size = 19 }) {
  const paths = { grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", book: "M12 5v16M12 5C8 2 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-5-2-9 1Z", calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18", user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2", users: "M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 21v-2a8 8 0 0 1 16 0v2M18 3a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 6", chart: "M3 3v18h18M7 16v-5m5 5V7m5 9V4", search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6", heart: "M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z", bag: "M4 7h16v14H4ZM8 8V6a4 4 0 0 1 8 0v2", bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 12h6", award: "M17 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM8 12l-2 9 6-3 6 3-2-9", leaf: "M5 20C3 10 8 3 21 3c0 12-6 17-16 17ZM5 20 16 8", settings: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2", wallet: "M3 5h17v16H3ZM14 10h7v6h-7Z", menu: "M4 6h16M4 12h16M4 18h16", close: "m6 6 12 12M18 6 6 18", arrow: "M4 12h16m-6-6 6 6-6 6", logout: "M9 3H3v18h6m5-15 6 6-6 6M8 12h12" };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid} /></svg>;
}
export default function WorkspaceShell({ children }) {
  const pathname = usePathname(); const router = useRouter();
  const [user, setUser] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const sequence = useRef(0);
  const verifiedRole = useRef("");
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const verify = useCallback(async () => {
    const id = ++sequence.current; setLoading(true); setError("");
    try {
      let identity = identityOf(await accountFetch("auth/me"));
      const requested = pathname.split("/")[2];
      if ((verifiedRole.current && verifiedRole.current !== roleOf(identity))) {
        const renewed = await fetch("/api/auth/refresh", { method: "POST", headers: { "x-csrf-token": getCsrfToken() }, signal: AbortSignal.timeout(20000) });
        if (!renewed.ok) throw new Error("Your account access changed. Please sign in again to renew your session.");
        identity = identityOf(await accountFetch("auth/me"));
      }
      const home = dashboardHome(identity); if (!home) throw new Error("Your account role does not have dashboard access."); if (id !== sequence.current) return;
      verifiedRole.current = roleOf(identity); setUser(identity); persistSession(identity);
      if (!canUseDashboard(identity, requested)) router.replace(home);
    }
    catch (caught) { if (id !== sequence.current) return; setUser(null); setError(caught.message); if (caught.status === 401) { clearSession(); router.replace(`/auth/login?next=${encodeURIComponent(pathname + window.location.search)}`); } }
    finally { if (id === sequence.current) setLoading(false); }
  }, [pathname, router]);
  useEffect(() => { const counter = sequence; const timer = setTimeout(() => void verify(), 0); const focus = () => void verify(); window.addEventListener("focus", focus); return () => { clearTimeout(timer); window.removeEventListener("focus", focus); counter.current++; }; }, [verify]);
  useEffect(() => { if (!open) return; const menu = menuRef.current; sidebarRef.current?.querySelector("a,button")?.focus(); const key = (event) => { if (event.key === "Escape") setOpen(false); if (event.key === "Tab") { const nodes = [...sidebarRef.current.querySelectorAll("a,button:not(:disabled)")]; if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); } } }; document.addEventListener("keydown", key); return () => { document.removeEventListener("keydown", key); menu?.focus(); }; }, [open]);
  const requestedWorkspace = pathname.split("/")[2]; const role = canUseDashboard(user, requestedWorkspace) ? requestedWorkspace : roleOf(user).toLowerCase(); const nav = role === "facilitator" ? facilitatorNavigation : userNavigation;
  const section = pathname.split("/")[3] || "overview"; const title = nav.find(([id]) => id === section)?.[1] || section.replace(/^./, letter => letter.toUpperCase());
  async function logout() { try { const response = await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": getCsrfToken() } }); if (!response.ok) throw new Error("Could not sign out. Please try again."); clearSession(); router.replace("/auth/login"); router.refresh(); } catch (caught) { setError(caught.message); } }
  if (loading && !user) return <div className="workspace workspace-gate" role="status"><span className="ws-spinner" />Verifying your account…</div>;
  if (!user) return <div className="workspace workspace-gate"><h1>Your account workspace</h1><p role="alert">{error}</p><button className="ws-button" onClick={verify}>Try again</button><Link href="/auth/login">Sign in</Link></div>;
  if (pathname.split("/")[2] !== role) return <div className="workspace workspace-gate" role="status">Opening your dashboard…</div>;
  return <WorkspaceContext.Provider value={{ user, role, verify }}><div className="workspace">
    {open && <button className="ws-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside id="workspace-sidebar" ref={sidebarRef} className={`ws-sidebar ${open ? "is-open" : ""}`} aria-label="Dashboard sidebar"><Link href="/" className="ws-brand"><Image src="/images/logo/awaken.png" alt="Awaken With Me" width={116} height={85} priority /><span>{role === "facilitator" ? "TEACHER WORKSPACE" : "YOUR LEARNING SPACE"}</span></Link><button className="ws-mobile-close ws-icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}><Icon name="close" /></button><nav aria-label={`${role} dashboard`}>{nav.map(([id, label, icon]) => <Link key={id} href={id === "application" ? facilitatorAction(user).href : hrefFor(role, id)} aria-current={id === section ? "page" : undefined} onClick={() => setOpen(false)}><Icon name={icon} /><span>{id === "application" ? facilitatorAction(user).label : label}</span>{id === "application" && <span className="ws-new">↗</span>}</Link>)}</nav>{role === "facilitator" && <Link className="ws-secondary" href="/dashboard/user">Switch to User Dashboard</Link>}<button className="ws-signout" onClick={logout}><Icon name="logout" />Sign out</button></aside>
    <div className="ws-main"><header className="ws-header"><button ref={menuRef} className="ws-mobile-menu ws-icon-button" aria-label="Open navigation" aria-controls="workspace-sidebar" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button><form className="ws-search" onSubmit={event => { event.preventDefault(); router.push(role === "user" ? `${hrefFor(role, "explore")}?q=${encodeURIComponent(query.trim())}` : `${hrefFor(role, "courses")}?q=${encodeURIComponent(query.trim())}`); }}><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={role === "facilitator" ? "Search your courses…" : "Search courses, workshops…"} aria-label="Search your workspace" /><button type="submit" className="sr-only">Search</button></form><Link href={role === "user" ? hrefFor(role, "notifications") : hrefFor(role, "bookings")} className="ws-icon-button" aria-label={role === "user" ? "Notifications" : "Bookings"}><Icon name={role === "user" ? "bell" : "calendar"} /></Link><Link href={hrefFor(role, "profile")} className="ws-account"><span className="ws-avatar">{(user.name || user.email || "A").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><span><strong>{user.name || user.email}</strong><small>{role === "facilitator" ? "Facilitator" : "Learner"}</small></span></Link></header>
    <div className="ws-content"><div className="ws-page-heading"><div><p className="ws-eyebrow">{role === "facilitator" ? "TEACH · INSPIRE · GROW" : "LEARN · PRACTICE · GROW"}</p><h1>{title}</h1></div><Link className="ws-text-link" href="/">Visit website ↗</Link></div>{error && <p role="alert" className="ws-alert">{error}</p>}{children}</div><footer className="ws-footer">Awaken With Me <span>Mindful learning. Meaningful growth.</span></footer></div>
  </div></WorkspaceContext.Provider>;
}
