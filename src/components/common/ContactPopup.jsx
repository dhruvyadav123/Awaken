"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const ContactContext = createContext(null);

export function ContactPopupProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = { openContact: () => setIsOpen(true) };
  return <ContactContext.Provider value={value}>
    {children}
    <ContactPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
  </ContactContext.Provider>;
}

export function ContactTrigger({ children = "Contact", className = "", onOpen }) {
  const context = useContext(ContactContext);
  if (!context) throw new Error("ContactTrigger must be used inside ContactPopupProvider");
  return <button className={"contact-trigger " + className} type="button"
    onClick={() => { onOpen?.(); context.openContact(); }}>{children}</button>;
}

function ContactPopup({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef("");
  const submissionLock = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  async function submitMessage(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
      source: "WEBSITE",
    };
    if (payload.name.length < 2 || !payload.subject || payload.message.length < 5) {
      setStatus("Please enter your name, a subject, and a message of at least 5 characters.");
      return;
    }
    const signature = JSON.stringify(payload);
    if (idempotencyKeyRef.current?.signature !== signature) {
      idempotencyKeyRef.current = {
        signature,
        key: window.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2),
      };
    }
    submissionLock.current = true;
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          idempotencyKey: idempotencyKeyRef.current.key,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success !== true || result?.data?.accepted !== true) throw new Error(result?.error || (result?.success === false && result?.message) || "Your message could not be sent. Please try again.");
      setStatus("Your message has been sent. We’ll be in touch soon.");
      form.reset();
      idempotencyKeyRef.current = null;
    } catch (error) {
      setStatus(error.name === "TimeoutError" || error.name === "AbortError" ? "The request took too long. Please try again." : error.message || "Your message could not be sent. Please try again.");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return <dialog ref={dialogRef} className="contact-dialog" aria-labelledby="contact-popup-title"
    onClose={onClose} onClick={event => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
    <div className="contact-popup-content">
      <button className="contact-popup-close" type="button" aria-label="Close contact popup" onClick={() => dialogRef.current?.close()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <p className="contact-popup-eyebrow">Awaken With Me</p>
      <h2 id="contact-popup-title">How can we help?</h2>
      <p className="contact-popup-intro">Send us a note about classes, events, or finding the right place to begin.</p>
      <form className="contact-popup-form" onSubmit={submitMessage} aria-busy={submitting}>
        <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>What is this about?<select name="subject" defaultValue="A question about Awaken With Me"><option>A question about Awaken With Me</option><option>Classes and training</option><option>Workshops and events</option><option>Infinity membership</option><option>Other</option></select></label>
        <label>Your message<textarea name="message" rows="3" minLength={5} maxLength={5000} required /></label>
        <button className="contact-popup-submit" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send message"}</button>
        <p className="contact-popup-status" aria-live="polite">{status || "Your message is sent securely through Awaken’s contact service."}</p>
      </form>
    </div>
  </dialog>;
}
