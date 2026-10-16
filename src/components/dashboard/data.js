"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
export function useApi(path) {
  const [data, setData] = useState(null); const [pagination, setPagination] = useState(null); const [error, setError] = useState(""); const [status, setStatus] = useState(null); const [loading, setLoading] = useState(Boolean(path)); const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current; if (!path) { setLoading(false); return; } setLoading(true); setError(""); setStatus(null);
    try { const result = await accountFetch(path); if (current !== generation.current) return; setData(result?.data ?? null); setPagination(result?.pagination ?? result?.data?.pagination ?? null); }
    catch (caught) { if (current === generation.current) { setError(caught.message); setStatus(caught.status); setData(null); } }
    finally { if (current === generation.current) setLoading(false); }
  }, [path]);
  useEffect(() => { const counter = generation; const timer = setTimeout(() => { setData(null); void reload(); }, 0); return () => { clearTimeout(timer); counter.current++; }; }, [reload]);
  return { data, pagination, error, status, loading, reload };
}
export const idOf = item => item?.id || item?._id;
export function rowsOf(data, keys = []) { if (Array.isArray(data)) return data; for (const key of [...keys, "items", "data", "records"]) if (Array.isArray(data?.[key])) return data[key]; return []; }
export function progressOf(item) { const value = item?.percentComplete ?? item?.percentage ?? item?.progressPercent ?? item?.progress?.percentComplete ?? item?.progress?.percentage ?? (typeof item?.progress === "number" ? item.progress : undefined); return value == null || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.min(100, Number(value))); }
export const labelOf = item => item?.title || item?.name || item?.displayName || item?.course?.title || item?.class?.title || item?.sessionType?.title || item?.user?.name || item?.student?.name || item?.email || "Details";
export function money(value, currency = "INR") { if (value == null || !Number.isFinite(Number(value))) return "—"; try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value)); } catch { return String(value); } }
export function date(value) { if (!value || !Number.isFinite(Date.parse(value))) return "—"; return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
