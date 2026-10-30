"use client";

import { useCallback, useEffect, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { displayMediaUrl } from "@/lib/record-display";

function toList(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["badges", "items", "data"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function asRecord(value) {
  return value?.badge && typeof value.badge === "object" ? value.badge : value;
}

function firstText(record, keys) {
  return keys.map((key) => record?.[key]).find((value) => typeof value === "string" && value.trim()) || "";
}

function formatDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("en-IN");
}

export default function BadgesPanel() {
  const [badges, setBadges] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = await accountFetch("me/badges");
      setBadges(toList(result?.data));
    } catch (caught) {
      setError(caught?.message || "We could not load your badges. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="min-h-[70vh] bg-[#fffefb] px-5 py-12 text-[#29473c] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#dfe7dd] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]">My Awaken</p>
          <h1 className="mt-1 font-[Georgia,serif] text-3xl text-[#17372d] sm:text-4xl">Badges</h1>
        </header>

        {busy && <p role="status" className="mt-8 text-sm">Loading your badges…</p>}

        {!busy && error && (
          <div role="alert" className="mt-8 rounded-lg bg-[#fff4f0] p-5 text-sm text-[#8a4c3c]">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className="mt-4 rounded-md border border-[#8a4c3c] px-4 py-2 font-semibold">
              Try again
            </button>
          </div>
        )}

        {!busy && !error && !badges.length && (
          <p className="mt-8 rounded-lg bg-white p-5 text-sm text-[#647368]">No badges to display yet.</p>
        )}

        {!busy && !error && badges.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {badges.map((item, index) => {
              const badge = asRecord(item) || {};
              const title = firstText(badge, ["title", "name", "label", "badgeName"]);
              const description = firstText(badge, ["description", "excerpt"]);
              const image = displayMediaUrl(firstText(badge, ["imageUrl", "image", "thumbnail", "iconUrl"]));
              const earnedAt = firstText(badge, ["earnedAt", "awardedAt"]);
              const status = firstText(badge, ["status"]);
              const key = badge.id || badge._id || badge.slug || title || index;

              return (
                <article key={key} className="rounded-xl border border-[#dfe7dd] bg-white p-6">
                  {image && <img src={image} alt={title || ""} className="mb-5 h-20 w-20 rounded-full object-cover" />}
                  {title && <h2 className="font-[Georgia,serif] text-2xl text-[#17372d]">{title}</h2>}
                  {description && <p className="mt-3 text-sm leading-6 text-[#647368]">{description}</p>}
                  {earnedAt && formatDate(earnedAt) && <p className="mt-3 text-sm text-[#647368]">Earned {formatDate(earnedAt)}</p>}
                  {status && <p className="mt-2 text-xs font-semibold uppercase tracking-[.12em] text-[#66836d]">{status}</p>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
