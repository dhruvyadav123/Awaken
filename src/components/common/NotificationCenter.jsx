"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const NotificationContext = createContext(null);
const copy = {
  success: { title: "Done", label: "Success" },
  error: { title: "Something went wrong", label: "Error" },
  info: { title: "Just so you know", label: "Information" },
};

function NotificationIcon({ type }) {
  if (type === "success") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 12.5 3 3 6.5-7" /></svg>;
  if (type === "error") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 8.5 7 7m0-7-7 7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 10.5v6m0-9v.1" /></svg>;
}

function Notification({ item, remove }) {
  useEffect(() => {
    if (item.duration === 0) return;
    const timer = window.setTimeout(() => remove(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item, remove]);

  return <article className={`awm-toast awm-toast-${item.type}`} role={item.type === "error" ? "alert" : "status"}>
    <span className="awm-toast-icon"><NotificationIcon type={item.type} /></span>
    <div className="awm-toast-copy"><strong>{item.title || copy[item.type].title}</strong>{item.message && <p>{item.message}</p>}</div>
    <button type="button" onClick={() => remove(item.id)} aria-label={`Dismiss ${copy[item.type].label.toLowerCase()} message`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10m0-10L7 17" /></svg></button>
    {item.duration !== 0 && <span className="awm-toast-timer" style={{ animationDuration: `${item.duration}ms` }} />}
  </article>;
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const sequence = useRef(0);
  const remove = useCallback(id => setItems(current => current.filter(item => item.id !== id)), []);
  const notify = useCallback((type, message, options = {}) => {
    const safeType = copy[type] ? type : "info";
    const id = ++sequence.current;
    setItems(current => [...current.slice(-2), { id, type: safeType, message: String(message || ""), title: options.title, duration: options.duration ?? (safeType === "error" ? 7000 : 5000) }]);
    return id;
  }, []);
  const value = useMemo(() => ({
    notify,
    success: (message, options) => notify("success", message, options),
    error: (message, options) => notify("error", message, options),
    info: (message, options) => notify("info", message, options),
    dismiss: remove,
  }), [notify, remove]);

  return <NotificationContext.Provider value={value}>{children}<aside className="awm-toast-region" aria-label="Notifications" aria-live="polite">{items.map(item => <Notification key={item.id} item={item} remove={remove} />)}</aside></NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}
