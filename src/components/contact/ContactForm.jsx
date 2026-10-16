"use client";

import { useRef, useState } from "react";

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const pendingRequest = useRef(null);
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
      source: "WEBSITE",
    };
    const signature = JSON.stringify(payload);
    if (payload.name.length < 2 || !payload.subject || payload.message.length < 5) {
      setStatus("Please enter your name, a subject, and a message of at least 5 characters.");
      setStatusType("error");
      return;
    }
    if (pendingRequest.current?.signature !== signature) {
      pendingRequest.current = {
        signature,
        key: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
    }
    submitting.current = true;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey: pendingRequest.current.key }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success !== true || result?.data?.accepted !== true) throw new Error(result?.error || (result?.success === false && result?.message) || "Your message could not be sent. Please try again.");
      setStatus("Your message has been sent. We’ll be in touch soon.");
      setStatusType("success");
      form.reset();
      pendingRequest.current = null;
    } catch (error) {
      setStatus(error.name === "TimeoutError" || error.name === "AbortError" ? "The request took too long. Please try again." : error.message || "Your message could not be sent. Please try again.");
      setStatusType("error");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="grid gap-5" aria-describedby="contact-form-status" aria-busy={busy}>
    <label className="grid gap-2 text-sm font-medium text-[#29473c]">Your name<input name="name" autoComplete="name" minLength={2} maxLength={120} required className="min-h-12 rounded-md border border-[#cbd8cb] bg-white px-4 font-normal outline-none focus:border-[#55745e] focus:ring-2 focus:ring-[#55745e]/20" /></label>
    <label className="grid gap-2 text-sm font-medium text-[#29473c]">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className="min-h-12 rounded-md border border-[#cbd8cb] bg-white px-4 font-normal outline-none focus:border-[#55745e] focus:ring-2 focus:ring-[#55745e]/20" /></label>
    <label className="grid gap-2 text-sm font-medium text-[#29473c]">Subject<select name="subject" defaultValue="" required className="min-h-12 rounded-md border border-[#cbd8cb] bg-white px-4 font-normal outline-none focus:border-[#55745e] focus:ring-2 focus:ring-[#55745e]/20"><option value="" disabled>Choose a topic</option><option>Classes and training</option><option>Sessions and availability</option><option>Workshops and events</option><option>Shop and products</option><option>Membership</option><option>Other</option></select></label>
    <label className="grid gap-2 text-sm font-medium text-[#29473c]">Your message<textarea name="message" rows={6} minLength={5} maxLength={5000} required className="resize-y rounded-md border border-[#cbd8cb] bg-white px-4 py-3 font-normal leading-6 outline-none focus:border-[#55745e] focus:ring-2 focus:ring-[#55745e]/20" /></label>
    <button type="submit" disabled={busy} className="min-h-12 justify-self-start rounded-md bg-[#315a48] px-7 text-sm font-semibold text-white hover:bg-[#254638] disabled:cursor-wait disabled:opacity-60">{busy ? "Sending…" : "Send message"}</button>
    <p id="contact-form-status" role="status" aria-live="polite" className={`min-h-6 text-sm ${statusType === "error" ? "text-[#8a4c3c]" : statusType === "success" ? "text-[#315a48]" : "text-[#647368]"}`}>{status || "Your message is sent securely through Awaken’s contact service."}</p>
  </form>;
}
