"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "We could not submit your email right now.");
      setStatus(result.message || "If eligible, a confirmation email will be sent.");
      setSubmitted(true);
      form.reset();
    } catch (error) {
      setStatus(error.message || "We could not submit your email right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="mt-7 max-w-[405px]" aria-labelledby="newsletter-title">
    <h2 id="newsletter-title" className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#476652]">Notes from Awaken</h2>
    <p className="mt-2 text-[12px] leading-5 text-[#65746a]">Occasional reflections and updates, sent by email.</p>
    <form className="mt-3 flex gap-2 max-[560px]:flex-col" onSubmit={submit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={submitting || submitted} placeholder="Your email address" className="min-h-10 min-w-0 flex-1 rounded border border-[#cbd8cb] bg-white px-3 text-xs text-[#29473c] outline-[#5574a4] disabled:opacity-60" />
      <button type="submit" disabled={submitting || submitted} className="min-h-10 shrink-0 rounded bg-[#315a48] px-4 text-xs font-semibold text-white hover:bg-[#254638] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Sending…" : submitted ? "Submitted" : "Subscribe"}</button>
    </form>
    <p className="mt-2 min-h-5 text-[11px] leading-5 text-[#65746a]" aria-live="polite">{status}</p>
  </section>;
}
