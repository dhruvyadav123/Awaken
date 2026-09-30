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
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function submitMessage(event) {
    event.preventDefault();
    if (!email) {
      setStatus("Message sending is not set up yet. Add the official contact email to enable it.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(data.get("subject"));
    const body = encodeURIComponent("From: " + data.get("name") + " (" + data.get("email") + ")\n\n" + data.get("message"));
    window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
    setStatus("Your email app should open with the message ready to send.");
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
      <form className="contact-popup-form" onSubmit={submitMessage}>
        <label>Your name<input name="name" autoComplete="name" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>What is this about?<select name="subject" defaultValue="A question about Awaken With Me"><option>A question about Awaken With Me</option><option>Classes and training</option><option>Workshops and events</option><option>Infinity membership</option><option>Other</option></select></label>
        <label>Your message<textarea name="message" rows="3" required /></label>
        <button className="contact-popup-submit" type="submit">{email ? "Continue to email" : "Message us"}</button>
        <p className="contact-popup-status" aria-live="polite">{status || (!email ? "Message delivery will be enabled when the official contact email is added." : "")}</p>
      </form>
    </div>
  </dialog>;
}
