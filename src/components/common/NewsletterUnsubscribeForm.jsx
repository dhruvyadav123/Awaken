"use client";

import { useState } from "react";

export default function NewsletterUnsubscribeForm({ token }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function unsubscribe() {
    if (!token || busy || done) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "We could not update your subscription.");
      setStatus(result.message || "Your newsletter preferences have been updated.");
      setDone(true);
    } catch (error) {
      setStatus(error.message || "We could not update your subscription. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-8"><button type="button" disabled={busy || done} onClick={unsubscribe} className="min-h-12 rounded-md bg-[#315a48] px-6 text-sm font-semibold text-white hover:bg-[#254638] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Updating…" : done ? "Updated" : "Unsubscribe"}</button><p className="mt-4 min-h-6 text-sm text-[#647368]" aria-live="polite">{status}</p></div>;
}
