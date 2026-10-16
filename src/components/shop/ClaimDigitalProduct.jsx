"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";

export default function ClaimDigitalProduct({ productId, disabled, className = "" }) {
  const key = useRef(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [entitlement, setEntitlement] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  async function claim() {
    if (pending.current || disabled || entitlement) return;
    pending.current = true; setBusy(true); setError(""); setStatus(null);
    try {
      key.current ||= crypto.randomUUID();
      const result = await accountFetch("me/digital-library/claim", { method: "POST", body: { productId, idempotencyKey: key.current } });
      if (!result.data?.id) throw new Error("The library entry could not be confirmed. Please try again.");
      setEntitlement(result.data);
    } catch (caught) { setError(caught.message); setStatus(caught.status); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className={className}>
    {entitlement ? <><p role="status" className="mb-3 text-sm">Added to your digital library.</p><Link className="inline-flex rounded-lg bg-[#28563e] px-5 py-3 text-sm font-semibold text-white" href={`/profile/digital-library/${encodeURIComponent(entitlement.id)}`}>Open in my library</Link></> : <button type="button" disabled={disabled || busy} onClick={claim} className="rounded-lg bg-[#28563e] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Adding to library…" : "Add to library — Free"}</button>}
    {error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">{error} {status === 401 && <Link className="underline" href={`/auth/login?next=${encodeURIComponent(window.location.pathname)}`}>Sign in to add this resource</Link>}</p>}
  </div>;
}
