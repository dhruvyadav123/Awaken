"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./dashboard.module.css";

const groups = [
  ["YOUR PRACTICE", [["Overview", "/dashboard", "grid"], ["My courses", "/profile/courses", "book"], ["Digital library", "/profile/digital-library", "book"], ["Meditations", "/profile/meditations", "sun"], ["My sessions", "/profile/sessions", "calendar"], ["Quizzes", "/profile/quizzes", "check"], ["Certificates & badges", "/profile/certificates", "award"]]],
  ["YOUR ACCOUNT", [["Membership", "/profile/membership", "award"], ["Orders & payments", "/profile/orders", "bag"], ["Notifications", "/profile/notifications", "bell"], ["Profile settings", "/profile/details", "user"], ["Saved addresses", "/profile/addresses", "pin"]]],
];

export function DashboardIcon({ name = "grid", className = "" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M12 5v16M12 5C9 2 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-6-2-9 1Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5h3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8 12-2 9 6-3 6 3-2-9" /></>,
    bag: <><rect x="4" y="7" width="16" height="14" rx="3" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 12h6" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    pin: <><path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0Z" /><circle cx="12" cy="9" r="2" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-2l1 7M4 12l1 7a8 8 0 0 0 14-2" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  };
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}

export default function DashboardShell({ user, busy, error, logout, retry, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = user?.name || user?.email?.split("@")[0] || "Your account";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <div className={styles.shell}>
    <div className={styles.mobileBar}><span>My Awaken</span><button type="button" aria-expanded={menuOpen} aria-controls="dashboard-navigation" onClick={() => setMenuOpen(!menuOpen)}><DashboardIcon name="menu" /> Account menu</button></div>
    <aside id="dashboard-navigation" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
      <Link href="/dashboard" className={styles.brand}><span className={styles.brandMark}><DashboardIcon name="sun" /></span><span>My Awaken<small>A little space for you.</small></span></Link>
      <nav aria-label="Dashboard navigation">{groups.map(([label, links]) => <div className={styles.navGroup} key={label}><p>{label}</p>{links.map(([title, href, icon]) => <Link key={href} href={href} aria-current={href === "/dashboard" ? "page" : undefined} className={href === "/dashboard" ? styles.activeNav : ""}><DashboardIcon name={icon} />{title}</Link>)}</div>)}</nav>
      <div className={styles.sidebarBottom}><Link href="/contact">Need a little help? <span>Get in touch →</span></Link><div className={styles.account}><span className={styles.avatar}>{initials}</span><div><strong>{name}</strong><small>{user?.email || "Your personal space"}</small></div></div>{user && <button type="button" onClick={logout}>Log out of account ↗</button>}</div>
    </aside>
    <div className={styles.content}>
      <header className={styles.topbar}><span>My space <span>/</span> <strong>Overview</strong></span><div><Link href="/classes">Explore classes <DashboardIcon name="arrow" /></Link><Link href="/profile/notifications" aria-label="View notifications" className={styles.notification}><DashboardIcon name="bell" /></Link></div></header>
      <div className={styles.body}>
        <div className={styles.greeting}><div><p className={styles.eyebrow}>YOUR PERSONAL SPACE</p><h1>{busy ? "Welcome to your space" : `Welcome back, ${name.split(" ")[0]}.`}</h1><p>Make room for yourself. Your next step starts here.</p></div><Link href="/profile/details" className={styles.secondary}>Edit profile <DashboardIcon name="user" /></Link></div>
        {busy && <div className={styles.loading} role="status">Loading your account…</div>}
        {error && <div className={styles.error} role="alert"><p>We couldn’t load your account. {error}</p><button type="button" onClick={retry}>Try again</button></div>}
        {children}
        <footer className={styles.footer}><DashboardIcon name="sun" /> Small steps. Meaningful change.<Link href="/contact">We’re here to help ↗</Link></footer>
      </div>
    </div>
  </div>;
}
