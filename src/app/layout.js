import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SiteChrome from "../components/layout/SiteChrome";
import { ContactPopupProvider } from "../components/common/ContactPopup";
import { appearanceStyle, getAppearance } from "../lib/appearance";
import { getCmsItems, normalizeCmsMenus } from "../lib/cms-content";
import { publicApi } from "../lib/public-api";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata() {
  const [appearance, websiteResult] = await Promise.all([getAppearance(), publicApi("website")]);
  const website = websiteResult.data;
  return {
    title: typeof website?.general?.siteName === "string" ? website.general.siteName : typeof appearance.siteName === "string" ? appearance.siteName : "Awaken With Me | Find your space to grow",
    description: typeof appearance.siteDescription === "string" ? appearance.siteDescription : "Explore thoughtful workshops, classes, and practices to reconnect with yourself.",
  };
}

export default async function RootLayout({ children }) {
  const [appearance, menuRecords, websiteResult] = await Promise.all([getAppearance(), getCmsItems("menus"), publicApi("website")]);
  const cmsMenus = normalizeCmsMenus(menuRecords);
  const website = websiteResult.data && typeof websiteResult.data === "object" ? websiteResult.data : {};
  if (typeof website.general?.siteName === "string" && website.general.siteName) appearance.siteName = website.general.siteName;
  return <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
    <body className="min-h-full flex flex-col" style={appearanceStyle(appearance)}>
      <ContactPopupProvider><a className="awm-skip-link" href="#main-content">Skip to content</a><SiteChrome><Navbar cmsMenus={cmsMenus} />{typeof appearance.announcementText === "string" && appearance.announcementText && <p className="bg-[var(--awm-brand-color,#315a48)] px-5 py-2 text-center text-sm text-white">{appearance.announcementText}</p>}</SiteChrome><main id="main-content" className="site-main">{children}</main><SiteChrome><Footer website={website} /></SiteChrome></ContactPopupProvider>
    </body>
  </html>;
}
