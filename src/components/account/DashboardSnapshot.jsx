"use client";
import { enrolledCourseId, courseLearningHref } from "@/lib/course-learning";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf, titleOf } from "@/lib/learning-data";
import { DashboardIcon } from "./DashboardShell";
import styles from "./dashboard.module.css";

const metrics = [
  ["Enrolled courses", "enrolledCourses", "book", "/profile/courses", "Your learning collection"],
  ["Completed courses", "completedCourses", "check", "/profile/courses", "Every step counts"],
  ["Upcoming classes", "upcomingClasses", "calendar", "/classes", "Time set aside for you"],
  ["Unread updates", "unreadNotifications", "bell", "/profile/notifications", "Stay in the loop"],
];
const shortcuts = [["Meditations", "Find a moment of calm", "/profile/meditations", "sun"], ["Certificates", "Celebrate your progress", "/profile/certificates", "award"], ["My orders", "Purchases & order history", "/profile/orders", "bag"], ["Practice quizzes", "Reflect on your learning", "/profile/quizzes", "check"]];
function dateOf(item) {
  const value = item.startsAt || item.startAt || item.date || item.scheduledAt || item.class?.startsAt || item.session?.startsAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(date, options = {}) {
  return date ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...options }).format(date) : "Date to be confirmed";
}
function progressOf(item) {
  const value = typeof item.progress === "object" && item.progress !== null ? item.progress.percentComplete ?? item.progress.percentage : item.progress ?? item.progressPercent ?? item.percentComplete ?? item.percentage;
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : null;
}
function sessionHref(item) {
  const id = item.kind === "session" ? item.bookingId || item.id : item.classId || item.class?.id || item.id;
  return item.kind === "session" ? id ? `/profile/sessions/${encodeURIComponent(id)}` : "/profile/sessions" : id ? `/profile/classes/${encodeURIComponent(id)}` : "/classes";
}
function Empty({ icon, title, description, href, action }) {
  return <div className={styles.empty}><DashboardIcon name={icon} /><h3>{title}</h3><p>{description}</p><Link href={href} className={styles.secondary}>{action}<DashboardIcon name="arrow" /></Link></div>;
}
function Card({ title, href, action, children, className = "" }) {
  return <section className={`${styles.card} ${className}`} aria-label={title}><div className={styles.cardHeader}><h2>{title}</h2>{href && <Link href={href} className={styles.textLink}>{action || "View all"} ↗</Link>}</div>{children}</section>;
}
export default function DashboardSnapshot() {
  const [dashboard, setDashboard] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [error, setError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestId = useRef(0);
  const load = useCallback(async (isRefresh = false) => {
    const current = ++requestId.current;
    setError(""); setAccessError("");
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const [overview, access] = await Promise.allSettled([accountFetch("me/dashboard?limit=5"), accountFetch("me/entitlements")]);
    if (current !== requestId.current) return;
    if (overview.status === "fulfilled") {
      const data = dataOf(overview.value);
      if (!data || typeof data !== "object" || Array.isArray(data)) setError("The account overview is unavailable. Please try again.");
      else { setDashboard(data); setUpdatedAt(new Date()); }
    } else setError(overview.reason?.message || "Please try again.");
    if (access.status === "fulfilled") setEntitlements(dataOf(access.value));
    else setAccessError("Membership benefits are temporarily unavailable.");
    setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); requestId.current += 1; };
  }, [load]);
  const summary = dashboard?.summary || {};
  const learning = listOf(dashboard, ["continueLearning"]);
  const upcoming = [...listOf(dashboard, ["upcomingClasses"]).map(item => ({ ...item, kind: "class" })), ...listOf(dashboard, ["upcomingSessions"]).map(item => ({ ...item, kind: "session" }))].sort((a, b) => (dateOf(a)?.getTime() ?? Infinity) - (dateOf(b)?.getTime() ?? Infinity));
  const next = upcoming[0];
  const activities = [...listOf(dashboard, ["recentNotifications"]).map(item => ({ ...item, activityType: "update" })), ...listOf(dashboard, ["recentOrders"]).map(item => ({ ...item, activityType: "order" }))].sort((a, b) => (dateOf({ date: b.createdAt })?.getTime() ?? 0) - (dateOf({ date: a.createdAt })?.getTime() ?? 0)).slice(0, 5);
  const membershipValue = dashboard?.membership;
  const membership = membershipValue?.membership ? { ...membershipValue.membership, hasMembership: membershipValue.hasMembership } : membershipValue;
  const benefits = listOf(entitlements, ["entitlements", "items", "benefits"]);
  return <section className={styles.overview} aria-label="Dashboard overview" aria-busy={loading || refreshing}>
    <div className={styles.overviewHeader}><span>{updatedAt ? <><i className={styles.liveDot} />Updated {formatDate(updatedAt, { hour: "numeric", minute: "2-digit" })} IST</> : "Your practice at a glance"}</span><button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className={styles.secondary}><DashboardIcon name="refresh" />{refreshing ? "Refreshing…" : "Refresh"}</button></div>
    {error && <div role="alert" className={styles.error}><p>{dashboard ? "Refresh failed. Showing the last loaded overview. " : "We couldn’t load your dashboard. "}{error}</p><button type="button" disabled={loading || refreshing} onClick={() => void load(Boolean(dashboard))}>Try again</button></div>}
    {loading && !dashboard && <div className={styles.metrics} role="status" aria-label="Loading your dashboard">{metrics.map(([label]) => <div key={label} className={styles.skeleton} />)}<span className="sr-only">Loading courses, sessions and account activity…</span></div>}
    {dashboard && <>
      <div className={styles.metrics}>{metrics.map(([label, key, icon, href, hint]) => <Link href={href} key={key} className={styles.metric}><div className={styles.metricTop}><span>{label}</span><span className={styles.metricIcon}><DashboardIcon name={icon} /></span></div><strong>{summary[key] ?? "—"}</strong><small>{hint}</small></Link>)}</div>
      <div className={styles.columns}><div className={styles.stack}>
        {next && <section className={styles.hero} aria-label="Your next step"><p className={styles.eyebrow}>{next ? "YOUR NEXT SESSION" : "A LITTLE TIME. A FRESH START."}</p><h2>{next ? titleOf(next.class || next.sessionType || next.session || next, "Your upcoming practice") : "Come back to yourself."}</h2><p>{next ? `${formatDate(dateOf(next), { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}${dateOf(next) ? " IST" : ""}` : "Explore a class, reconnect with your practice, and take the next step at your own pace."}</p><Link href={next ? sessionHref(next) : "/classes"} className={styles.primary}>{next ? "View session details" : "Find your next class"}<DashboardIcon name="arrow" /></Link></section>}
        <Card title="Continue learning" href="/profile/courses" action="My courses">{learning.length ? <ul>{learning.map((item, index) => {
          const id = enrolledCourseId(item);
          const progress = progressOf(item);
          return <li key={id || index} className={styles.course}><div className={styles.courseHeading}><span className={styles.courseIcon}><DashboardIcon name="book" /></span><div><h3>{titleOf(item.course || item, "Your course")}</h3><small>{item.nextLesson?.title || item.course?.category?.name || "Continue at your own pace"}</small></div><Link href={courseLearningHref(item) || "/profile/courses"} aria-label={`Continue ${titleOf(item.course || item, "course")}`}><DashboardIcon name="arrow" /></Link></div>{progress !== null && <><div className={styles.progressLabels}><span>Course progress</span><span>{Math.round(progress)}% complete</span></div><div role="progressbar" aria-label={`${titleOf(item.course || item, "Course")} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className={styles.progress}><span style={{ width: `${progress}%` }} /></div></>}</li>;
        })}</ul> : <Empty icon="book" title="Your learning journey starts here" description="Courses you’re working on will appear here, ready for your next lesson." href="/courses" action="Explore courses" />}</Card>
        <Card title="Recent activity" href="/profile/notifications" action="All updates">{activities.length ? <ul>{activities.map((item, index) => <li key={`${item.activityType}-${item.id || index}`} className={styles.activity}><DashboardIcon name={item.activityType === "order" ? "bag" : "bell"} /><div><Link href={item.activityType === "order" ? item.id ? `/profile/orders/${encodeURIComponent(item.id)}` : "/profile/orders" : "/profile/notifications"}><h3>{item.activityType === "order" ? `Order ${item.number || item.orderNumber || item.id || "update"}` : item.title || "Account update"}</h3></Link><p>{item.body || item.message || item.status || "View the latest details in your account."}</p>{item.createdAt && <small>{formatDate(dateOf({ date: item.createdAt }), { day: "numeric", month: "short" })}</small>}</div></li>)}</ul> : <Empty icon="bell" title="You’re all caught up" description="Your account updates and order activity will appear here when available." href="/profile/notifications" action="View notifications" />}</Card>
      </div><aside className={styles.stack} aria-label="Sessions and membership">
        <Card title="Coming up" href="/profile/sessions" action="My sessions">{upcoming.length ? <ul>{upcoming.slice(0, 4).map((item, index) => {
          const date = dateOf(item);
          return <li key={`${item.kind}-${item.id || index}`} className={styles.session}><div className={styles.dateTile}><span>{date ? formatDate(date, { month: "short" }) : "Soon"}</span><strong>{date ? formatDate(date, { day: "numeric" }) : "—"}</strong></div><div><Link href={sessionHref(item)}><h3>{titleOf(item.class || item.sessionType || item.session || item, "Upcoming session")}</h3></Link><p>{date ? `${formatDate(date, { weekday: "short", hour: "numeric", minute: "2-digit" })} IST` : "Date to be confirmed"}</p><span className={styles.badge}>{item.status ? String(item.status).replaceAll("_", " ").toLowerCase() : "Scheduled"}</span></div></li>;
        })}</ul> : <Empty icon="calendar" title="Make space for a practice" description="Your booked classes and private sessions will appear here." href="/classes" action="Browse classes" />}</Card>
        <Card title="Your membership" className={styles.membership}><p className={styles.eyebrow}>{membership?.hasMembership ? "YOUR PLAN" : "ROOM TO GROW"}</p><h3>{membership?.hasMembership ? membership.plan?.name || "Your membership" : "Go a little deeper."}</h3><p>{membership?.hasMembership ? `Membership status: ${membership.status ? String(membership.status).replaceAll("_", " ").toLowerCase() : "View your plan for current details"}.` : "Explore membership options and find the support that fits your journey."}</p>{benefits.length > 0 && <ul className={styles.benefits}>{benefits.slice(0, 4).map((item, index) => <li key={item.id || index}>✓ {typeof item === "string" ? item : titleOf(item, item.label || "Membership benefit")}</li>)}</ul>}{accessError && <p role="status">{accessError}</p>}<Link href={membership?.hasMembership ? "/profile/membership" : "/infinity/membership"} className={styles.secondary}>{membership?.hasMembership ? "Manage membership" : "Explore membership"}<DashboardIcon name="arrow" /></Link></Card>
        <Card title="Make it your own"><p className="text-xs leading-6 text-[#6b7971]">Keep your profile and delivery details up to date, so everything is ready when you need it.</p><Link href="/profile/details" className={`${styles.secondary} mt-4`}>Account settings<DashboardIcon name="arrow" /></Link></Card>
      </aside></div>
    </>}
    <div><div className={styles.cardHeader}><h2>More for your journey</h2></div><nav aria-label="Quick access" className={styles.shortcuts}>{shortcuts.map(([title, description, href, icon]) => <Link href={href} key={href} className={styles.shortcut}><DashboardIcon name={icon} /><strong>{title} ↗</strong><small>{description}</small></Link>)}</nav></div>
    {dashboard?.capabilities?.canApplyToBecomeFacilitator && <Link href="/become-a-facilitator" className={styles.textLink}>Share your practice. Become a facilitator ↗</Link>}
  </section>;
}
