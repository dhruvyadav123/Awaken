export function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("awm-session");
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function persistSession(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("awm-session", JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("awm-session");
}