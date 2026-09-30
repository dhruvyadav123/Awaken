"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContactTrigger } from "../common/ContactPopup";

export const navigationLinks = [
  ["Home", "/"],
  ["Classes", "/classes"],
  ["Workshops", "/workshops"],
  ["Facilitators", "/facilitators"],
  ["Blog", "/blog"],
  ["Testimonials", "/testimonials"],
  ["Meditations", "/meditations"],
  ["Shop", "/shop"],
  ["Infinity", "/infinity"],
  ["Contact", "/contact"],
];

const navLinkClasses = "relative inline-flex min-h-[84px] items-center px-px py-0 text-[15px] leading-[1.2] font-normal whitespace-nowrap text-[#1766a5] transition-colors duration-150 after:absolute after:right-0 after:bottom-[17px] after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:content-[''] after:transition-transform hover:text-[#0e4f87] hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:text-[#0e4f87] aria-[current=page]:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb2d0]";

export default function PrimaryNavigation({ mobile = false, onNavigate }) {
  const pathname = usePathname();

  return (
    <nav
      className={mobile ? "hidden" : "min-w-0 flex-[0_1_900px] max-[1080px]:hidden"}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      <ul className="m-0 flex list-none items-center justify-between gap-[clamp(10px,1vw,14px)] p-0 max-[1240px]:gap-[13px]">
        {navigationLinks.map(([label, href]) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              {href === "/contact" ? (
                <ContactTrigger className={`${navLinkClasses} !text-[#1766a5] !text-[15px] !font-normal !leading-[1.2]`} onOpen={onNavigate}>
                  {label}
                </ContactTrigger>
              ) : (
                <Link
                  href={href}
                  className={navLinkClasses}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
