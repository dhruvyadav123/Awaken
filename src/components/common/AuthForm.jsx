"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { persistSession } from "@/lib/session";
import { safeReturnPath } from "@/lib/return-path";
import { useNotifications } from "@/components/common/NotificationCenter";

export default function AuthForm({ mode }) {
  const isSignUp = mode === "signup";
  const router = useRouter();
  const notifications = useNotifications();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [resendEmail, setResendEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const submissionLock = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    setMessage("");
    setCanResend(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    if (isSignUp && password !== data.get("confirmPassword")) {
      const text = "Your passwords do not match. Please check them and try again.";
      setMessage(text);
      setMessageType("error");
      notifications.error(text, { title: "Check your password" });
      return;
    }

    submissionLock.current = true;
    setBusy(true);
    try {
      const response = await fetch(isSignUp ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const requestError = new Error(result.error || "We could not complete that request. Please try again.");
        requestError.status = response.status;
        requestError.code = result.code;
        throw requestError;
      }

      if (result.user) {
        persistSession(result.user);
      }

      if (result.message) {
        setMessage(result.message);
        setMessageType("success");
      }

      notifications.success(result.message || (isSignUp ? "Your account is ready." : "Welcome back. You’re signed in."), { title: isSignUp ? "Account created" : "Welcome back" });

      form.reset();
      const fallback = result.redirectTo || "/profile";
      const destination = result.user ? safeReturnPath(new URLSearchParams(window.location.search).get("next"), result.user, fallback) : fallback;
      router.push(destination);
      router.refresh();
    } catch (error) {
      const enteredEmail = String(data.get("email") || "").trim();
      if (!isSignUp && enteredEmail && (error.code === "EMAIL_NOT_VERIFIED" || error.status === 403 || /verif/i.test(error.message))) {
        setResendEmail(enteredEmail);
        setCanResend(true);
      }
      const text = error.message || "We could not connect. Please try again in a moment.";
      setMessage(text);
      setMessageType("error");
      notifications.error(text, { title: isSignUp ? "Account not created" : "Sign in failed" });
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (resending || !resendEmail) return;
    setResending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resend", email: resendEmail }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not send a new verification email.");
      setMessage(result.message || "A new verification email has been sent.");
      setMessageType("success");
      notifications.success(result.message || "A new verification email has been sent.", { title: "Email sent" });
      setCanResend(false);
    } catch (error) {
      const text = error.message || "We could not send a new verification email.";
      setMessage(text);
      setMessageType("error");
      notifications.error(text, { title: "Email not sent" });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <aside className="auth-aside">
          <span className="auth-mark" aria-hidden="true">A<span>.</span></span>
          <p className="auth-eyebrow">A little space for you</p>
          <p className="auth-aside-quote">Your practice,<br /><em>your own pace.</em></p>
          <p className="auth-aside-note">Sign in to return to your learning space, or create an account to begin.</p>
          <Link className="auth-back-link" href="/">← Back to Awaken With Me</Link>
        </aside>

        <section className="auth-panel" aria-labelledby="auth-title">
          <p className="auth-eyebrow">{isSignUp ? "A new beginning" : "Welcome back"}</p>
          <h1 id="auth-title">{isSignUp ? "Create your account" : "Sign in"}</h1>
          <p className="auth-intro">{isSignUp ? "Make a little room for your practice." : "Pick up where you left off."}</p>
          <form className="auth-form" onSubmit={submit}>
            {isSignUp ? <label>Your name<input name="name" type="text" autoComplete="name" placeholder="Your name" minLength={2} maxLength={80} required /></label> : null}
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label>
            <label>Password<span className="auth-password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "At least 8 characters" : "Your password"} minLength={isSignUp ? 8 : undefined} maxLength={128} required /><button type="button" className="auth-show-password" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></span></label>
            {isSignUp ? <label>Confirm password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" minLength={8} maxLength={128} required /></label> : <div className="auth-forgot-row"><Link href="/auth/forgot-password">Forgot password?</Link></div>}
            {isSignUp ? <label className="auth-consent"><input name="terms" type="checkbox" required /><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</span></label> : null}
            {message ? <p className={`auth-message auth-message-${messageType}`} role="status">{message}</p> : null}
            {canResend ? <button type="button" className="auth-switch" disabled={resending} onClick={resendVerification}>{resending ? "Sending verification email…" : "Resend verification email"}</button> : null}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}<span aria-hidden="true">→</span></button>
          </form>
          <p className="auth-switch">{isSignUp ? "Already have an account?" : "New to Awaken With Me?"} <Link href={isSignUp ? "/auth/login" : "/auth/register"} onClick={event => { const next = new URLSearchParams(window.location.search).get("next"); if (next) { event.preventDefault(); router.push((isSignUp ? "/auth/login" : "/auth/register") + "?next=" + encodeURIComponent(next)); } }}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
          <p className="auth-privacy-note">Your details are handled securely and never shown publicly.</p>
        </section>
      </div>
    </main>
  );
}
