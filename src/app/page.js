
import { Suspense } from "react";
import CinematicHero from "@/components/website/home/CmsHomeHero";
import HomeCmsSections from "@/components/website/home/HomeCmsSections";
import HomeContentSections from "@/components/website/home/HomeContentSections";
import HomepageMotion from "@/components/website/home/HomepageMotion";
import HomeAboutSection from "@/components/website/home/HomeAboutSection";
import "./home.css";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HomepageMotion>
        <Suspense fallback={<div role="status" className="min-h-64 bg-[#faf8f2] px-6 py-16 text-sm text-[#315a48]">Loading Awaken…</div>}><CinematicHero /></Suspense>
        <Suspense fallback={null}><HomeAboutSection /></Suspense>
        <Suspense fallback={null}><HomeContentSections /></Suspense>
        <Suspense fallback={null}><HomeCmsSections /></Suspense>
      </HomepageMotion>
    </>
  );
}
