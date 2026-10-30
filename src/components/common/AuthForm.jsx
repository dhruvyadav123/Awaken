
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { persistSession } from "@/lib/session";
import { safeReturnPath } from "@/lib/return-path";
import { useNotifications } from "@/components/common/NotificationCenter";
import styles from "./AuthForm.module.css";

function Icon({ name, size = 19 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "mail") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common}>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "eye-off") {
    return (
      <svg {...common}>
        <path d="m3 3 18 18" />
        <path d="M10.6 5.1A12 12 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4" />
        <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 7 10 7c1.5 0 2.8-.3 4-.9" />
      </svg>
    );
  }

  return null;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  minLength,
  maxLength,
  showPassword,
  onTogglePassword,
  onChange,
}) {
  const isPassword = type === "password";

  const inputType =
    isPassword && showPassword ? "text" : type;

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>

      <span className={styles.inputBox}>
        <span className={styles.inputIcon}>
          <Icon name={icon} />
        </span>

        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          onChange={onChange}
          required
        />

        {isPassword && (
          <button
            type="button"
            className={styles.eyeButton}
            onClick={onTogglePassword}
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            aria-pressed={Boolean(showPassword)}
          >
            <Icon
              name={showPassword ? "eye-off" : "eye"}
              size={19}
            />
          </button>
        )}
      </span>
    </label>
  );
}

export default function AuthForm({ mode = "login" }) {
  const isSignUp =
    mode === "signup" || mode === "register";

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

  const switchPath = isSignUp
    ? "/auth/login"
    : "/auth/register";

  const togglePassword = () => {
    setShowPassword((value) => !value);
  };

  const clearMessage = () => {
    setMessage("");
  };

  function handleSwitch(event) {
    const next = new URLSearchParams(
      window.location.search
    ).get("next");

    if (!next) return;

    event.preventDefault();

    router.push(
      `${switchPath}?next=${encodeURIComponent(next)}`
    );
  }

  async function submit(event) {
    event.preventDefault();

    if (submissionLock.current) return;

    setMessage("");
    setCanResend(false);

    const form = event.currentTarget;
    const data = new FormData(form);

    const password = String(
      data.get("password") || ""
    );

    if (
      isSignUp &&
      password !== data.get("confirmPassword")
    ) {
      const text =
        "Your passwords do not match. Please try again.";

      setMessage(text);
      setMessageType("error");

      notifications.error(text, {
        title: "Check your password",
      });

      return;
    }

    submissionLock.current = true;
    setBusy(true);

    try {
      const response = await fetch(
        isSignUp
          ? "/api/auth/signup"
          : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.get("name"),
            email: String(
              data.get("email") || ""
            ).trim(),
            password,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          result.error ||
            "We could not complete your request. Please try again."
        );

        error.status = response.status;
        error.code = result.code;

        throw error;
      }

      if (result.user) {
        persistSession(result.user);
      }

      if (result.message) {
        setMessage(result.message);
        setMessageType("success");
      }

      notifications.success(
        result.message ||
          (isSignUp
            ? "Your account has been created."
            : "Welcome back. You are signed in."),
        {
          title: isSignUp
            ? "Account created"
            : "Welcome back",
        }
      );

      form.reset();

      const fallback =
        result.redirectTo || "/profile";

      const next = new URLSearchParams(
        window.location.search
      ).get("next");

      const destination = result.user
        ? safeReturnPath(
            next,
            result.user,
            fallback
          )
        : fallback;

      router.push(destination);
      router.refresh();
    } catch (error) {
      const enteredEmail = String(
        data.get("email") || ""
      ).trim();

      if (
        !isSignUp &&
        enteredEmail &&
        (
          error.code === "EMAIL_NOT_VERIFIED" ||
          /verif/i.test(String(error.message || ""))
        )
      ) {
        setResendEmail(enteredEmail);
        setCanResend(true);
      }

      const text =
        error.message ||
        "We could not connect. Please try again.";

      setMessage(text);
      setMessageType("error");

      notifications.error(text, {
        title: isSignUp
          ? "Account not created"
          : "Sign in failed",
      });
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
      const response = await fetch(
        "/api/auth/recovery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "resend",
            email: resendEmail,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            "We could not send a verification email."
        );
      }

      const text =
        result.message ||
        "A new verification email has been sent.";

      setMessage(text);
      setMessageType("success");
      setCanResend(false);

      notifications.success(text, {
        title: "Email sent",
      });
    } catch (error) {
      const text =
        error.message ||
        "We could not send a verification email.";

      setMessage(text);
      setMessageType("error");

      notifications.error(text, {
        title: "Email not sent",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section
        className={styles.authCard}
        aria-labelledby="auth-title"
      >
        <Link
          href="/"
          className={styles.backLink}
        >
          <span aria-hidden="true">←</span>
          Back to website
        </Link>

        <div className={styles.heading}>
          <div className={styles.brand}>
            AwakenWithMeheck
          </div>

          <h1 id="auth-title">
            {isSignUp
              ? "Create your account"
              : "Welcome back"}
          </h1>

          <p>
            {isSignUp
              ? "Begin your mindful journey with us."
              : "Sign in to continue your journey."}
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={submit}
        >
          {isSignUp && (
            <Field
              label="Full name"
              name="name"
              icon="user"
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              onChange={clearMessage}
            />
          )}

          <Field
            label="Email address"
            name="email"
            icon="mail"
            type="email"
            placeholder="Enter your email address"
            autoComplete="email"
            maxLength={254}
            onChange={clearMessage}
          />

          <Field
            label="Password"
            name="password"
            icon="lock"
            type="password"
            placeholder={
              isSignUp
                ? "Create a password"
                : "Enter your password"
            }
            autoComplete={
              isSignUp
                ? "new-password"
                : "current-password"
            }
            minLength={
              isSignUp ? 8 : undefined
            }
            maxLength={128}
            showPassword={showPassword}
            onTogglePassword={togglePassword}
            onChange={clearMessage}
          />

          {isSignUp ? (
            <Field
              label="Confirm password"
              name="confirmPassword"
              icon="lock"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
              onChange={clearMessage}
            />
          ) : (
            <div className={styles.options}>
              <Link href="/auth/forgot-password">
                Forgot password?
              </Link>
            </div>
          )}

          {isSignUp && (
            <label className={styles.consent}>
              <input
                name="terms"
                type="checkbox"
                required
              />

              <span>
                I agree to the{" "}
                <Link href="/terms">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          )}

          {message && (
            <div
              className={`${styles.message} ${
                messageType === "success"
                  ? styles.success
                  : styles.error
              }`}
              role={
                messageType === "error"
                  ? "alert"
                  : "status"
              }
            >
              {message}
            </div>
          )}

          {canResend && (
            <button
              type="button"
              className={styles.resend}
              disabled={resending}
              onClick={resendVerification}
            >
              {resending
                ? "Sending verification email..."
                : "Resend verification email"}
            </button>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={busy}
          >
            <span>
              {busy
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </span>

            {!busy && (
              <span
                className={styles.arrow}
                aria-hidden="true"
              >
                →
              </span>
            )}

            {busy && (
              <span
                className={styles.spinner}
                aria-hidden="true"
              />
            )}
          </button>
        </form>

        <div className={styles.switch}>
          <span>
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>

          <Link
            href={switchPath}
            onClick={handleSwitch}
          >
            {isSignUp
              ? "Sign in"
              : "Create an account"}
          </Link>
        </div>

        <p className={styles.privacy}>
          Your information is kept private and secure.
        </p>
      </section>
    </main>
  );
}
