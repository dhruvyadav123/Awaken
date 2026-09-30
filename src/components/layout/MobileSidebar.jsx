"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ContactTrigger } from "../common/ContactPopup";

const menuItems = [
  { label: "Home", href: "/" },
  { label: "Workshops", children: [["Workshops and events", "/workshops"], ["Classes and training", "/classes"]] },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
  { label: "About us", href: "/about" },
  { label: "Facilitator", children: [["Meet the facilitators", "/facilitators"], ["Become a facilitator", "/become-a-facilitator"]] },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Meditations", href: "/meditations" },
  { label: "Infinity", href: "/infinity" },
];

const categories = [
  ["Classes and training", "/classes"],
  ["Workshops and events", "/workshops"],
  ["Meditations", "/meditations"],
  ["Community", "/infinity"],
  ["Journal", "/blog"],
  ["Shop", "/shop"],
];

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const drawerRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector("button")?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function visitCategory(event) {
    const href = event.currentTarget.value;
    if (!href) return;
    router.push(href);
    close();
  }

  return <div className="awm-mobile-menu">
    <button ref={triggerRef} className="awm-mobile-trigger" type="button" aria-label="Open menu"
      aria-expanded={isOpen} aria-controls="awm-mobile-drawer" onClick={() => setIsOpen(true)}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    </button>
    {isOpen ? <div className="awm-mobile-layer">
      <button className="awm-mobile-backdrop" type="button" aria-label="Close menu" onClick={close} />
      <aside id="awm-mobile-drawer" ref={drawerRef} className="awm-mobile-drawer" role="dialog" aria-modal="true" aria-labelledby="awm-drawer-title">
        <div className="awm-drawer-header">
          <Link href="/" className="awm-drawer-brand" aria-label="Awaken With Meheck home" onClick={close}>
            <Image src="/images/logo/awaken.png" alt="Awaken with Meheck" width={126} height={112} priority />
          </Link>
          <h2 id="awm-drawer-title" className="awm-sr-only">Site menu</h2>
          <button className="awm-drawer-close" type="button" aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="awm-drawer-account">
          <Link href="/auth/login" onClick={close}>Login</Link>
          <Link href="/auth/register" onClick={close}>Register</Link>
        </div>

        <label className="awm-sr-only" htmlFor="awm-drawer-categories">Browse categories</label>
        <select id="awm-drawer-categories" className="awm-drawer-categories" defaultValue="" onChange={visitCategory}>
          <option value="" disabled>Categories</option>
          {categories.map(([label, href]) => <option key={href} value={href}>{label}</option>)}
        </select>

        <form className="awm-drawer-search" action="/search" role="search">
          <label className="awm-sr-only" htmlFor="awm-drawer-search-input">Search the website</label>
          <input id="awm-drawer-search-input" name="q" type="search" placeholder="Search here..." />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          </button>
        </form>

        <nav className="awm-drawer-navigation" aria-label="Mobile navigation">
          <ul>
            {menuItems.map(item => {
              const active = item.href === "/" ? pathname === "/" : item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
              return <li className={active ? "is-active" : ""} key={item.label}>
                {item.children ? <details className="awm-drawer-group">
                  <summary>{item.label}</summary>
                  <ul>{item.children.map(([label, href]) => <li key={href}>
                    <Link href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>
                  </li>)}</ul>
                </details> : item.href === "/contact" ? <ContactTrigger className="awm-drawer-link" onOpen={close}>{item.label}</ContactTrigger> : <Link className="awm-drawer-link" href={item.href} aria-current={active ? "page" : undefined} onClick={close}>{item.label}</Link>}
              </li>;
            })}
            <li><ContactTrigger className="awm-drawer-link" onOpen={close}>Contact</ContactTrigger></li>
          </ul>
        </nav>

        <div className="awm-drawer-legal">
          <Link href="/privacy-policy" onClick={close}>Privacy</Link>
          <Link href="/terms" onClick={close}>Terms</Link>
          <Link href="/refund-policy" onClick={close}>Refunds</Link>
        </div>
      </aside>
    </div> : null}
  </div>;
}
