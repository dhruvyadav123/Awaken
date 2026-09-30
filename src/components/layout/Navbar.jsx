import Image from "next/image";
import Link from "next/link";

import PrimaryNavigation from "./PrimaryNavigation";
import HeaderActions from "./HeaderActions";
import MobileSidebar from "./MobileSidebar";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[60] w-full bg-white shadow-[0_1px_0_rgb(35_57_86/8%)]">
      <div className="bg-[#f4f5f7]">
        <div className="mx-auto flex min-h-[42px] w-[min(100%-40px,1280px)] items-center justify-end max-[520px]:min-h-10 max-[1080px]:w-[min(100%-32px,1280px)]">
          <form
            action="/search"
            method="get"
            role="search"
            className="flex h-8 gap-[5px] max-[520px]:w-[min(100%,340px)]"
          >
            <label htmlFor="awm-site-search" className="sr-only">
              Search the website
            </label>

            <div className="flex min-w-44 items-center gap-[7px] rounded-[7px] border border-[#d7dce5] bg-white px-[10px] max-[520px]:min-w-0 max-[520px]:flex-1">
              <svg className="size-[15px] shrink-0 stroke-[#71809a] stroke-[1.7]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>

              <input
                id="awm-site-search"
                name="q"
                type="search"
                placeholder="Search ..."
                className="w-full min-w-0 border-0 text-xs text-[#27456d] outline-0 [font:inherit]"
              />
            </div>

            <button className="cursor-pointer rounded-md border-0 bg-[#315b9d] px-[13px] text-xs text-white hover:bg-[#244676]" type="submit">Search</button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex min-h-[68px] w-[min(100%-40px,1280px)] items-center gap-[clamp(14px,1.4vw,20px)] max-[1080px]:min-h-16 max-[1080px]:w-[min(100%-32px,1280px)]">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="Awaken with Meheck home"
        >
          <Image
            src="/images/logo/awaken.png"
            alt="Awaken with Meheck"
            width={76}
            height={78}
            priority
            sizes="76px"
            className="block h-14 w-[54px] object-contain max-[520px]:h-[50px] max-[520px]:w-12"
          />
        </Link>

        <PrimaryNavigation />

        <HeaderActions />
        <MobileSidebar />
      </div>
    </header>
  );
}