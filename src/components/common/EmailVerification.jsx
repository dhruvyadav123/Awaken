"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useNotifications } from "./NotificationCenter";

export default function EmailVerification({ token = "" }) {
  const notifications = useNotifications();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function verify() {
    if (lock.current || !token) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify", token }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Email verification failed.");
      const message = result.message || "Your email has been verified.";
      setNotice(message);
      notifications.success(message, { title: "Email verified" });
    } catch (caught) {
      const message = caught.name === "TimeoutError" ? "Email verification timed out. Please try again." : caught.message || "Email verification failed.";
      setError(message);
      notifications.error(message, { title: "Verification failed" });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-panel mx-auto max-w-xl">
    <p className="auth-eyebrow">Awaken With Me</p>
    <h1>Verify your email</h1>
    <p className="auth-intro">Confirm the email address linked to your account.</p>
    {!token && <p className="auth-message auth-message-error" role="alert">This verification link is incomplete. Open the full link from your email.</p>}
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    {notice && <p className="auth-message auth-message-success" role="status">{notice}</p>}
    {!notice && <button className="auth-submit" type="button" disabled={busy || !token} onClick={verify}>{busy ? "Verifying…" : "Verify email"}</button>}
    <Link className="auth-switch" href="/auth/login">Continue to sign in</Link>
  </section></main>;
}
