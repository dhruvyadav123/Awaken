"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { canAccessDigitalItem, digitalFileBlob } from "@/lib/digital-library";
import { useApi, rowsOf } from "@/components/dashboard/data";

const buttonClass = "rounded-lg border border-[#cbd8cb] px-4 py-2 text-sm font-semibold text-[#315a48] disabled:opacity-50";

function LibraryFile({ item, file }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open(download) {
    if (pending.current || !canAccessDigitalItem(item)) return;
    pending.current = true; setBusy(true); setError("");
    const previewable = /^(application\/pdf|image\/(png|jpeg|gif|webp|avif)|audio\/[^;]+|video\/[^;]+)$/.test(file.mimeType || "");
    const tab = download || !previewable ? null : window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const blob = await digitalFileBlob(accountFetch, item.id, file.fileId);
      const href = URL.createObjectURL(blob);
      if (tab) tab.location.replace(href);
      else {
        const anchor = document.createElement("a");
        anchor.href = href;
        const extension = { "application/pdf": ".pdf", "audio/mpeg": ".mp3", "video/mp4": ".mp4", "image/png": ".png", "image/jpeg": ".jpg", "application/epub+zip": ".epub" }[file.mimeType] || "";
        const name = (file.title || "resource").replace(/[\\/:*?"<>|]/g, "_");
        anchor.download = extension && !name.toLowerCase().endsWith(extension) ? name + extension : name;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(href), 300000);
    } catch (caught) { tab?.close(); setError(caught.message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <li className="rounded-lg border border-[#dfe7dd] bg-white p-5"><h3 className="font-semibold">{file.title || "Digital resource"}</h3><p className="mt-1 text-sm text-[#647368]">{file.kind} {file.mimeType && `· ${file.mimeType}`} {Number.isFinite(file.size) && `· ${(file.size / 1048576).toFixed(2)} MB`}</p><div className="mt-4 flex flex-wrap gap-3"><button className={buttonClass} disabled={busy || !canAccessDigitalItem(item)} onClick={() => open(false)}>{busy ? "Preparing file…" : "Open file"}</button><button className={buttonClass} disabled={busy || !canAccessDigitalItem(item)} onClick={() => open(true)}>Download</button></div>{error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">{error} Try opening the file again for fresh access.</p>}</li>;
}

export default function DigitalLibrary({ entitlementId, embedded = false }) {
  const [page, setPage] = useState(1);
  const base = embedded ? "/dashboard/user/digital-library" : "/profile/digital-library";
  const state = useApi(entitlementId ? `me/digital-library/${encodeURIComponent(entitlementId)}` : `me/digital-library?page=${page}&limit=20`);
  const items = rowsOf(state.data, ["entitlements", "digitalLibrary"]);
  const item = entitlementId ? state.data : null;
  return <main className="min-h-[60vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-5xl">
    <Link className="text-sm font-semibold underline" href={entitlementId ? base : embedded ? "/dashboard/user" : "/profile"}>Back</Link>
    <h1 className="mt-6 font-[Georgia,serif] text-4xl">{entitlementId ? item?.product?.name || "Digital resource" : "My digital library"}</h1>
    <div className="mt-4 flex flex-wrap gap-4"><Link className="text-sm font-semibold underline" href="/shop">Explore the shop</Link><button className="text-sm underline disabled:opacity-50" disabled={state.loading} onClick={state.reload}>Refresh library</button></div>
    {state.loading && <p className="mt-8" role="status">Loading your library…</p>}
    {state.error && <div role="alert" className="mt-6 rounded-lg bg-[#fff4f0] p-5"><p>{state.error}</p>{state.status === 401 ? <Link className="underline" href={`/auth/login?next=${encodeURIComponent(entitlementId ? `${base}/${entitlementId}` : base)}`}>Sign in to view your library</Link> : <button className="underline" onClick={state.reload}>Try again</button>}</div>}
    {!state.loading && !state.error && (entitlementId ? item && <section className="mt-8 space-y-5"><p className="leading-7 text-[#647368]">{item.product?.description || item.product?.shortDescription}</p><p className="text-sm">Status: {item.status}{item.expiresAt && ` · Access until ${new Date(item.expiresAt).toLocaleDateString("en-IN")}`}</p>{!canAccessDigitalItem(item) && <p role="status" className="rounded-lg bg-white p-4">Access is currently unavailable for this resource. Check its payment or expiry status, then refresh your library.</p>}<ul className="space-y-4">{(item.files || []).map(file => <LibraryFile key={file.fileId} item={item} file={file} />)}</ul>{!item.files?.length && <p>No files are available for this resource yet.</p>}</section> : <>
      {items.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2">{items.map(entry => <article key={entry.id} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">{entry.product?.name || "Digital resource"}</h2><p className="mt-3 text-sm leading-6 text-[#647368]">{entry.product?.shortDescription || entry.product?.description}</p><p className="mt-3 text-sm">{canAccessDigitalItem(entry) ? "Available" : "Access unavailable"} · {entry.files?.length || 0} file(s)</p><Link className="mt-4 inline-block text-sm font-semibold underline" href={`${base}/${encodeURIComponent(entry.id)}`}>View resource</Link></article>)}</div> : <p className="mt-8 rounded-xl bg-white p-6">Your digital library is empty. Free resources you claim and digital purchases will appear here.</p>}
      {(page > 1 || state.pagination?.pages > 1) && <nav aria-label="Library pages" className="mt-8 flex items-center gap-4"><button className={buttonClass} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {state.pagination?.pages || page}</span><button className={buttonClass} disabled={!state.pagination?.pages || page >= state.pagination.pages} onClick={() => setPage(page + 1)}>Next</button></nav>}
    </>)}
  </div></main>;
}
