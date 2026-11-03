import { Suspense } from "react";

import Navbar from "@/components/common/layout/Navbar";
import Footer from "@/components/common/layout/Footer";
import SiteChrome from "@/components/common/layout/SiteChrome";
import { ContactPopupProvider } from "../components/common/ContactPopup";
import { NotificationProvider } from "../components/common/NotificationCenter";
import OpeningSplash from "../components/common/OpeningSplash";
import { getAppearance } from "../lib/appearance";
import { getCmsItems, normalizeCmsMenus } from "../lib/cms-content";
import { publicApi } from "../lib/public-api";
import "./globals.css";

export const metadata = {
  title: "AwakenWithMeheck | Find your space to grow",
  description: "Explore thoughtful workshops, classes, and practices to reconnect with yourself.",
};

async function SiteHeader() {
  const [appearance, menuRecords] = await Promise.all([getAppearance(), getCmsItems("menus")]);
  const cmsMenus = normalizeCmsMenus(menuRecords);
  return <SiteChrome><Navbar cmsMenus={cmsMenus} />{typeof appearance.announcementText === "string" && appearance.announcementText && <p className="bg-[var(--awm-brand-color,#315a48)] px-5 py-2 text-center text-sm text-white">{appearance.announcementText}</p>}</SiteChrome>;
}

async function SiteFooter() {
  const [websiteResult, footerRecords] = await Promise.all([
    publicApi("website"),
    getCmsItems("footer-settings"),
  ]);
  const website = websiteResult.data && typeof websiteResult.data === "object" ? websiteResult.data : {};
  return <SiteChrome><Footer website={website} footerRecords={footerRecords} /></SiteChrome>;
}

function HeaderFallback() {
  return <div className="h-[74px] border-b border-[#e6eee7] bg-white" aria-hidden="true" />;
}

function FooterFallback() {
  return <footer className="w-full border-t border-[#DFE8DF] bg-[#FAFCF9]" aria-hidden="true"><div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10"><div className="h-5 w-36 animate-pulse rounded bg-[#e5eee5]" /><div className="mt-4 h-3 w-72 max-w-full animate-pulse rounded bg-[#edf3ed]" /></div></footer>;
}

export default function RootLayout({ children }) {
  return <html lang="en" className="h-full antialiased">
    <body className="min-h-full flex flex-col">
      <OpeningSplash />
      <NotificationProvider><ContactPopupProvider><a className="awm-skip-link" href="#main-content">Skip to content</a><Suspense fallback={<HeaderFallback />}><SiteHeader /></Suspense><main id="main-content" className="site-main">{children}</main><Suspense fallback={<FooterFallback />}><SiteFooter /></Suspense></ContactPopupProvider></NotificationProvider>
    </body>
  </html>;
}
