"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, readStoredSession } from "@/lib/session";

export default function UserDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(readStoredSession());
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fffefb] px-6 py-20 text-[#25352e]">
        <div className="mx-auto max-w-2xl rounded-[26px] border border-[#e3e6df] bg-white p-10 text-center shadow-[0_20px_60px_rgba(38,58,49,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315c4c]">Your space</p>
          <h1 className="mt-5 font-[Georgia,serif] text-4xl text-[#17372d]">Your dashboard is waiting.</h1>
          <p className="mt-4 text-lg text-[#465951]">
            Sign in to view your practice plan, sessions, and saved resources.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/login" className="rounded-full bg-[#234d3c] px-7 py-3 text-white transition hover:bg-[#163d2f]">Sign in</Link>
            <Link href="/auth/register" className="rounded-full border border-[#234d3c] px-7 py-3 text-[#17372d] transition hover:bg-[#f6f8f2]">Create account</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffefb] px-6 py-12 text-[#25352e]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 rounded-[28px] border border-[#ebeee5] bg-[#f8f7f2] p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315c4c]">Welcome back</p>
            <h1 className="mt-2 font-[Georgia,serif] text-4xl text-[#17372d]">Hello, {user.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#dfe7dc] bg-white px-3 py-1.5 text-sm text-[#385d4c]">{user.email}</span>
            <button type="button" onClick={handleLogout} className="rounded-full border border-[#234d3c] px-5 py-2.5 text-sm text-[#17372d] transition hover:bg-white">Log out</button>
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-[24px] border border-[#e7e7de] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6d7d71]">Practice path</p>
            <h2 className="mt-4 font-[Georgia,serif] text-3xl text-[#17372d]">3 sessions</h2>
            <p className="mt-2 text-[#50615b]">You have three guided sessions scheduled this week.</p>
          </article>

          <article className="rounded-[24px] border border-[#e7e7de] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6d7d71]">Saved resources</p>
            <h2 className="mt-4 font-[Georgia,serif] text-3xl text-[#17372d]">8 items</h2>
            <p className="mt-2 text-[#50615b]">Your wellness resources and classes are ready to revisit.</p>
          </article>

          <article className="rounded-[24px] border border-[#e7e7de] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6d7d71]">Next step</p>
            <h2 className="mt-4 font-[Georgia,serif] text-3xl text-[#17372d]">Explore</h2>
            <p className="mt-2 text-[#50615b]">Browse classes, journals, and the latest mindfulness resources.</p>
          </article>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-[#e7e7de] bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-[Georgia,serif] text-3xl text-[#17372d]">Your upcoming rhythm</h3>
              <Link href="/classes" className="text-sm font-medium text-[#234d3c]">View all</Link>
            </div>
            <ul className="mt-6 space-y-4">
              {[
                ["Breathwork reset", "Today · 7:30 AM"],
                ["Nature journaling", "Thursday · 6:15 PM"],
                ["Gentle movement", "Saturday · 9:00 AM"],
              ].map(([title, time]) => (
                <li key={title} className="flex items-center justify-between rounded-2xl border border-[#edf0ea] bg-[#f9faf5] px-4 py-3">
                  <div>
                    <p className="font-medium text-[#263e36]">{title}</p>
                    <p className="text-sm text-[#5f7168]">{time}</p>
                  </div>
                  <span className="rounded-full bg-[#ecf2e6] px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-[#295640]">Booked</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-[28px] border border-[#e7e7de] bg-[#f5f7f2] p-8 shadow-sm">
            <h3 className="font-[Georgia,serif] text-3xl text-[#17372d]">Quick links</h3>
            <div className="mt-6 space-y-3">
              <Link href="/classes" className="block rounded-2xl border border-[#dfe6da] bg-white px-4 py-3 text-[#21473a] hover:bg-[#f2f6ee]">Browse classes</Link>
              <Link href="/shop" className="block rounded-2xl border border-[#dfe6da] bg-white px-4 py-3 text-[#21473a] hover:bg-[#f2f6ee]">Explore resources</Link>
              <Link href="/dashboard/settings" className="block rounded-2xl border border-[#dfe6da] bg-white px-4 py-3 text-[#21473a] hover:bg-[#f2f6ee]">Account settings</Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}