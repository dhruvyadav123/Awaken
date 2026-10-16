"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { clearSession, getStoredSessionSnapshot, subscribeSession } from "@/lib/session";

const sessions = [
  { day: "Today", time: "7:30 AM", title: "Breathwork reset" },
  { day: "Thu", time: "6:15 PM", title: "Nature journaling" },
  { day: "Sat", time: "9:00 AM", title: "Gentle movement" },
];

const quickLinks = [
  { href: "/classes", label: "Browse classes", hint: "Find your next session" },
  { href: "/shop", label: "Explore resources", hint: "Guides, journals and more" },
  { href: "/dashboard/settings", label: "Account settings", hint: "Profile and preferences" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234d3c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffefb]";

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export default function UserDashboard() {
  const storedSession = useSyncExternalStore(subscribeSession, getStoredSessionSnapshot, () => "");
  const user = useMemo(() => {
    try {
      const session = JSON.parse(storedSession);
      return session?.email ? session : null;
    } catch {
      return null;
    }
  }, [storedSession]);

  function handleLogout() {
    clearSession();
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffefb] px-6 py-20 text-[#25352e]">
        <div className="w-full max-w-lg rounded-3xl border border-[#e3e6df] bg-white p-10 text-center shadow-[0_20px_60px_rgba(38,58,49,0.06)]">
          <h1 className="font-[Georgia,serif] text-4xl text-[#17372d]">Your dashboard is waiting</h1>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-[#465951]">
            Sign in to see your sessions and saved resources.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/login" className={`rounded-full bg-[#234d3c] px-7 py-3 text-center text-white transition hover:bg-[#163d2f] ${focusRing}`}>
              Sign in
            </Link>
            <Link href="/auth/register" className={`rounded-full border border-[#234d3c] px-7 py-3 text-center text-[#17372d] transition hover:bg-[#f6f8f2] ${focusRing}`}>
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const displayName = user.name || user.email.split("@")[0];
  const firstName = displayName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();
  const [next, ...later] = sessions;

  return (
    <main className="min-h-screen bg-[#fffefb] px-6 pb-20 pt-10 text-[#25352e]">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b border-[#ebeee5] pb-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ecf2e6] font-[Georgia,serif] text-xl text-[#234d3c]" aria-hidden="true">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-[#5f7168]">{user.email}</p>
              <p className="truncate font-medium text-[#17372d]">{displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`min-h-11 rounded-full border border-[#234d3c] px-5 text-sm text-[#17372d] transition hover:bg-[#f6f8f2] ${focusRing}`}
          >
            Log out
          </button>
        </header>

        {/* Greeting */}
        <section className="pt-12">
          <h1 className="font-[Georgia,serif] text-4xl leading-tight text-[#17372d] md:text-5xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-[#465951]">
            You have {sessions.length} sessions booked this week.
          </p>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Up next */}
            <section className="relative overflow-hidden rounded-3xl bg-[#234d3c] p-8 text-white md:p-10">
              <svg className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-white/10" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="100" cy="100" r="30" />
                <circle cx="100" cy="100" r="60" />
                <circle cx="100" cy="100" r="90" />
              </svg>
              <p className="text-sm text-[#cfe0d4]">Up next</p>
              <h2 className="mt-3 font-[Georgia,serif] text-3xl md:text-4xl">{next.title}</h2>
              <p className="mt-2 text-lg text-[#e3eee6]">
                {next.day} at {next.time}
              </p>
              <Link
                href="/classes"
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fffefb] px-6 text-sm font-medium text-[#17372d] transition hover:bg-[#f2f6ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#234d3c]"
              >
                View session
                <Chevron />
              </Link>
            </section>

            {/* Schedule */}
            <section className="rounded-3xl border border-[#e7e7de] bg-white p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-[Georgia,serif] text-2xl text-[#17372d]">Later this week</h2>
                <Link href="/classes" className={`rounded text-sm font-medium text-[#234d3c] underline-offset-4 hover:underline ${focusRing}`}>
                  View all
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-[#edf0ea]">
                {later.map((item) => (
                  <li key={item.title} className="flex items-center gap-5 py-4">
                    <div className="w-16 shrink-0">
                      <p className="font-[Georgia,serif] text-lg text-[#17372d]">{item.day}</p>
                      <p className="text-sm text-[#5f7168]">{item.time}</p>
                    </div>
                    <p className="min-w-0 flex-1 truncate font-medium text-[#263e36]">{item.title}</p>
                    <span className="rounded-full bg-[#ecf2e6] px-3 py-1 text-xs font-medium text-[#295640]">Booked</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right column */}
          <aside className="h-fit rounded-3xl border border-[#e7e7de] bg-[#f5f7f2] p-6 md:p-8">
            <h2 className="font-[Georgia,serif] text-2xl text-[#17372d]">Quick links</h2>
            <ul className="mt-4 divide-y divide-[#dfe6da]">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`group flex items-center justify-between gap-4 rounded-xl py-4 text-[#21473a] transition hover:text-[#163d2f] ${focusRing}`}
                  >
                    <span>
                      <span className="block font-medium">{link.label}</span>
                      <span className="mt-0.5 block text-sm text-[#5f7168]">{link.hint}</span>
                    </span>
                    <span className="transition group-hover:translate-x-0.5">
                      <Chevron />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}