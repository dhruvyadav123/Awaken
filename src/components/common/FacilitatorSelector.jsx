"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function FacilitatorSelector({ initialLinks, currentName = "All Facilitators" }) {
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const requestRef = useRef(null);
  const [links, setLinks] = useState(initialLinks || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    function closeOutside(event) {
      if (!dropdownRef.current?.contains(event.target) && dropdownRef.current) {
        dropdownRef.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, []);

  useEffect(() => {
    if (dropdownRef.current) dropdownRef.current.open = false;
  }, [pathname]);

  function loadLinks() {
    if (initialLinks !== undefined || requestRef.current) return;
    setLoading(true);
    setError(false);
    requestRef.current = fetch("/api/navigation/facilitators")
      .then((response) => {
        if (!response.ok) throw new Error("Unavailable");
        return response.json();
      })
      .then((result) => setLinks(Array.isArray(result.links) ? result.links : []))
      .catch(() => {
        requestRef.current = null;
        setError(true);
      })
      .finally(() => setLoading(false));
  }

  const options = Array.from(new Map([
    { label: "All Facilitators", href: "/facilitators" },
    ...links,
  ].map((link) => [link.href, link])).values());

  return <div className="w-full max-w-sm">
    <p className="mb-2 text-xs font-medium text-[#647368]">Browse facilitators</p>
    <details ref={dropdownRef} className="group border-b border-[#cdd7df]"
      onToggle={(event) => { if (event.currentTarget.open) loadLinks(); }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        dropdownRef.current.open = false;
        dropdownRef.current.querySelector("summary")?.focus();
      }}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm text-[#29473c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb2d0] [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 break-words">{currentName}</span>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <ul className="max-h-64 overflow-y-auto overscroll-contain border-t border-[#e7ecef] py-1">
        {options.map((link) => <li key={link.href}><Link href={link.href} prefetch={false}
          aria-current={pathname === link.href ? "page" : undefined}
          onClick={() => { dropdownRef.current.open = false; }}
          className="block break-words px-3 py-2.5 text-sm text-[#315b75] hover:bg-[#f5f7f9] focus-visible:bg-[#f5f7f9] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8fb2d0] aria-[current=page]:font-semibold">
          {link.label}
        </Link></li>)}
      </ul>
      {loading && <p role="status" className="px-3 py-2 text-sm text-[#647368]">Loading facilitators...</p>}
      {error && <p role="alert" className="px-3 py-2 text-sm text-[#647368]">Could not load facilitators. <button type="button" onClick={loadLinks} className="cursor-pointer text-[#1766a5] underline">Try again</button></p>}
    </details>
  </div>;
}
