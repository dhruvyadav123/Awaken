
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { accountFetch } from "@/lib/client-account";

export const btn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#315a48] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#254536] disabled:cursor-not-allowed disabled:opacity-50";

export const lightBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#cfdbd3] bg-white px-4 py-2 text-sm font-semibold text-[#315a48] transition-colors hover:bg-[#eef4ef] disabled:cursor-not-allowed disabled:opacity-50";

export const dangerBtn =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50";

export const input =
  "mt-1.5 block w-full min-w-0 rounded-lg border border-[#d6e1d9] bg-white px-3.5 py-2.5 text-sm text-[#263e30] outline-none focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10 disabled:bg-slate-50";

export const label =
  "block min-w-0 text-sm font-medium text-[#354e40]";

export const panel =
  "rounded-xl border border-[#e0e9e2] bg-white p-4 sm:p-6";

export function useLoad(path) {
  const [snapshot, setSnapshot] = useState({
    data: null,
    pagination: null,
    loading: Boolean(path),
    error: "",
  });

  const reload = useCallback(
    async (signal) => {
      if (!path) {
        setSnapshot({
          data: null,
          pagination: null,
          loading: false,
          error: "",
        });
        return null;
      }

      setSnapshot((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const result = await accountFetch(path, { signal });

        if (signal?.aborted) return null;

        setSnapshot({
          data: result.data,
          pagination:
            result.pagination ||
            result.data?.pagination ||
            null,
          loading: false,
          error: "",
        });

        return result;
      } catch (e) {
        if (!signal?.aborted) {
          setSnapshot((prev) => ({
            ...prev,
            loading: false,
            error: e.message || "Could not load data.",
          }));
        }

        return null;
      }
    },
    [path]
  );

  useEffect(() => {
    const controller = new AbortController();
    reload(controller.signal);

    return () => controller.abort();
  }, [reload]);

  return {
    ...snapshot,
    reload,
  };
}

export function Note({ error, success }) {
  if (error) {
    return (
      <p
        role="alert"
        className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p
        role="status"
        className="my-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
      >
        {success}
      </p>
    );
  }

  return null;
}

export function Busy({
  state,
  empty = "Nothing here yet.",
}) {
  if (state.loading) {
    return (
      <p
        role="status"
        className="py-12 text-center text-sm text-slate-500"
      >
        Loading…
      </p>
    );
  }

  if (state.error) {
    return (
      <div className="py-6">
        <Note error={state.error} />
        <button
          className={lightBtn}
          type="button"
          onClick={() => state.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (
    state.data == null ||
    (Array.isArray(state.data) && !state.data.length)
  ) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return null;
}

export function Pager({
  pagination,
  page,
  setPage,
}) {
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600"
    >
      <span>
        Page {pagination.page || page} of {pagination.pages}
        {" · "}
        {pagination.total} total
      </span>

      <div className="flex gap-2">
        <button
          className={lightBtn}
          disabled={page <= 1}
          onClick={() => setPage((n) => n - 1)}
        >
          Previous
        </button>

        <button
          className={lightBtn}
          disabled={page >= pagination.pages}
          onClick={() => setPage((n) => n + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export function Status({ value }) {
  const state = String(value || "DRAFT").toUpperCase();

  const color =
    state === "PUBLISHED" ||
    state === "ACTIVE" ||
    state === "COMPLETED" ||
    state === "PRESENT" ||
    state === "ANSWERED" ||
    state === "PASSED"
      ? "bg-emerald-50 text-emerald-800"
      : state === "PENDING_APPROVAL" ||
          state === "REGISTERED"
        ? "bg-amber-50 text-amber-800"
        : state === "REJECTED" ||
            state === "ARCHIVED" ||
            state === "ABSENT"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {state.replaceAll("_", " ")}
    </span>
  );
}

export function Confirm({
  title,
  message,
  confirm,
  danger = false,
  busy = false,
  disabled = false,
  onClose,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-[#253c2c]">
          {title}
        </h3>

        <div className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={lightBtn}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={danger ? dangerBtn : btn}
            disabled={busy || disabled}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
