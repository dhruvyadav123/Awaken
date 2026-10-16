export const SESSION_UPDATED_EVENT = "awm-session-updated";

export function getStoredSessionSnapshot() {
  try {
    return window.localStorage.getItem("awm-session") ?? "";
  } catch {
    return "";
  }
}


export function subscribeSession(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_UPDATED_EVENT, callback);
  };
}


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
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}



export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("awm-session");
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

