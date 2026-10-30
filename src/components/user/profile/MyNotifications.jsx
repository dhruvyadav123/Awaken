"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf } from "@/lib/learning-data";

function actionHref(action) {
  if (!action?.kind) return "";
  const id = action.id ? encodeURIComponent(action.id) : "";
  switch (action.kind) {
    case "ACCOUNT": return "/profile";
    case "COURSE": return id ? `/profile/courses/${id}` : "/profile/courses";
    case "CLASS": return id ? `/profile/classes/${id}` : "/classes";
    case "SESSION": return id ? `/profile/sessions/${id}` : "/profile/sessions";
    case "MEMBERSHIP": return id ? `/profile/membership/${id}` : "/profile/membership";
    case "ORDER": return id ? `/profile/orders/${id}` : "/profile/orders";
    default: return "";
  }
}

export default function MyNotifications() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountFetch(`me/notifications?${unreadOnly ? "read=false&" : ""}page=${page}&limit=20`);
      setItems(listOf(dataOf(result), ["notifications", "items"]));
      setPages(Math.max(1, Number(result.pagination?.pages) || 1)); setError("");
    } catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  }, [page, unreadOnly]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function markRead(id) {
    setWorking(id); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH", body: {} });
      setNotice(result.message || "Notification marked as read."); await load();
    } catch (caught) { setError(caught.message); }
    finally { setWorking(""); }
  }
  async function markAll() {
    setWorking("all"); setError(""); setNotice("");
    try {
      const result = await accountFetch("me/notifications/read-all", { method: "PATCH", body: {} });
      setNotice(result.message || "All notifications marked as read."); await load();
    } catch (caught) { setError(caught.message); }
    finally { setWorking(""); }
  }

  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href="/profile" className="text-sm font-semibold text-[#315a48] underline">← My account</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">Notifications</h1><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => { setUnreadOnly(true); setPage(1); }} aria-pressed={unreadOnly} className={`rounded-full px-4 py-2 text-sm ${unreadOnly ? "bg-[#315a48] text-white" : "border border-[#cbd8cb]"}`}>Unread</button><button type="button" onClick={() => { setUnreadOnly(false); setPage(1); }} aria-pressed={!unreadOnly} className={`rounded-full px-4 py-2 text-sm ${!unreadOnly ? "bg-[#315a48] text-white" : "border border-[#cbd8cb]"}`}>Read</button><button type="button" disabled={Boolean(working)} onClick={markAll} className="ml-auto text-sm font-semibold text-[#315a48] underline disabled:opacity-50">{working === "all" ? "Updating…" : "Mark all as read"}</button></div>
    {loading && <p className="mt-6" role="status">Loading notifications…</p>}{error && <p className="mt-6 text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 text-[#315a48]" role="status">{notice}</p>}
    {!loading && !error && (items.length ? <div className="mt-6 grid gap-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-[#dfe7dd] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">{item.title || "Account update"}</h2>{item.createdAt && <time className="text-xs text-[#647368]">{new Date(item.createdAt).toLocaleString("en-IN")}</time>}</div><p className="mt-2 text-sm leading-7 text-[#647368]">{item.body}</p><div className="mt-3 flex gap-5 text-sm">{actionHref(item.action) && <Link href={actionHref(item.action)} className="font-semibold text-[#315a48] underline">View related item</Link>}{!item.read && <button type="button" disabled={Boolean(working)} onClick={() => markRead(item.id)} className="text-[#315a48] underline disabled:opacity-50">Mark as read</button>}</div></article>)}</div> : <p className="mt-6 rounded-xl bg-white p-6">No {unreadOnly ? "unread" : "read"} notifications.</p>)}
    {pages > 1 && <nav className="mt-6 flex items-center gap-5 text-sm" aria-label="Notification pages"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-40">Next</button></nav>}
  </div></main>;
}
