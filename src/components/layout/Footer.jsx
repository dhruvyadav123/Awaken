import Image from "next/image";
import Link from "next/link";
import { ContactTrigger } from "../common/ContactPopup";
import { getCmsItems, getCmsPayload, getFooterConfig, getTextValue, safeLink } from "@/lib/cms-content";
import NewsletterForm from "../common/NewsletterForm";

const explore = [
  ["Start here", "/start-here"],
  ["Classes", "/classes"],
  ["Sessions", "/sessions"],
  ["Courses", "/courses"],
  ["Workshops", "/workshops"],
  ["Facilitators", "/facilitators"],
  ["Community stories", "/testimonials"],
  ["Journal", "/blog"],
  ["Meditations", "/meditations"],
  ["Shop", "/shop"],
];

const helpful = [
  ["Infinity membership", "/infinity/membership"],
  ["Our story", "/about"],
  ["Become a facilitator", "/become-a-facilitator"],
  ["Contact", "/contact"],
  ["Verify a certificate", "/certificates/verify"],
  ["Privacy policy", "/privacy-policy"],
  ["Refund policy", "/refund-policy"],
  ["Terms of use", "/terms"],
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
    >
      <path
        d="M4 10H16M11.5 5.5L16 10L11.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        d="M20 10C20 15 12 21 12 21C12 21 4 15 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="10"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 42 42"
      fill="none"
      aria-hidden="true"
      className="h-7 w-7"
    >
      <path
        d="M21 36C21 25 24 16 33 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20 26C12 26 7 21 7 14C14 13 20 18 20 26Z"
        fill="currentColor"
        opacity=".28"
      />
      <path
        d="M23 19C24 11 28 7 35 6C36 14 31 19 23 19Z"
        fill="currentColor"
        opacity=".5"
      />
    </svg>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-[5px] w-[5px] rounded-full bg-[#6c8674]" />
      <h2 className="m-0 text-[10px] font-bold tracking-[0.22em] text-[#29483a] uppercase">
        {children}
      </h2>
    </div>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div className="min-w-0">
      <SectionTitle>{title}</SectionTitle>

      <ul className="m-0 grid list-none gap-[13px] p-0">
        {links.map(([label, href]) => (
          <li key={href}>
            {href === "/contact" ? (
              <ContactTrigger className="group relative inline-flex cursor-pointer text-left text-[13px] leading-5 text-[#65746a] transition-colors duration-300 hover:text-[#29483a]">
                {label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#54705e] transition-all duration-300 group-hover:w-full" />
              </ContactTrigger>
            ) : (
              <Link
                href={href}
                className="group relative inline-flex text-[13px] leading-5 text-[#65746a] transition-colors duration-300 hover:text-[#29483a]"
              >
                {label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#54705e] transition-all duration-300 group-hover:w-full" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer({ website = {} }) {
  const timezone = website.general?.timezone || "Asia/Kolkata";
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: timezone }).format(new Date());
  const [footerRecords, socialRecords] = await Promise.all([getCmsItems("footer-settings"), getCmsItems("social-links")]);
  const settings = getFooterConfig(footerRecords);
  const description = getTextValue(settings, "description", "aboutText", "footerDescription", "companyDescription");
  const tagline = getTextValue(settings, "tagline", "brandTagline");
  const address = settings.address || settings.visitAddress;
  const addressLines = Array.isArray(address) ? address.filter((line) => typeof line === "string" && line.trim()) : typeof address === "string" && address.trim() ? address.split(/\r?\n/).filter(Boolean) : [];
  const email = getTextValue(settings, "email", "contactEmail");
  const phone = getTextValue(settings, "phone", "contactPhone") || getTextValue(website.general, "supportPhone");
  const copyright = getTextValue(settings, "copyright", "copyrightText") || `© ${year} Awaken With Meheck. All rights reserved.`;
  const visitNote = getTextValue(settings, "visitNote", "locationNote");
  const mapHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addressLines.join(", "));
  const websiteComponents = Array.isArray(website.components) ? website.components : [];
  const cmsSocials = [...socialRecords, ...websiteComponents.filter((item) => item.kind === "SOCIAL_LINK")].map(getCmsPayload).filter((item) => !item.kind || item.kind === "SOCIAL_LINK");
  const socials = cmsSocials.length ? cmsSocials : Array.isArray(settings.socialLinks) ? settings.socialLinks : Array.isArray(settings.socials) ? settings.socials : [];
  const seenSocialLinks = new Set();
  const socialLinks = socials.flatMap((item) => {
    const label = getTextValue(item, "label", "name", "title");
    const href = safeLink(getTextValue(item, "url", "href", "websiteUrl"), { allowExternal: true });
    if (!label || !href) return [];
    const key = JSON.stringify([label, href]);
    if (seenSocialLinks.has(key)) return [];
    seenSocialLinks.add(key);
    return [{ key, label, href }];
  });

  return (
    <footer className="relative w-full overflow-hidden border-t border-[#d7e0d5] bg-[#f1f4ee]">
      {/* Subtle background atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-48 -left-48 h-[430px] w-[430px] rounded-full bg-[#cad8ca]/35 blur-[120px]" />

        <div className="absolute -right-52 bottom-[-220px] h-[500px] w-[500px] rounded-full bg-[#b8cbb9]/28 blur-[130px]" />

        <div className="absolute top-0 left-1/2 h-px w-[min(72vw,880px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#adbdaf] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-6 pt-16 pb-6 max-[900px]:pt-14 max-[560px]:px-5 max-[560px]:pt-12">
        <div className="grid grid-cols-[minmax(330px,1.6fr)_minmax(130px,.7fr)_minmax(180px,.9fr)_minmax(230px,1fr)] gap-x-14 gap-y-12 pb-14 max-[1080px]:gap-x-8 max-[900px]:grid-cols-2 max-[900px]:pb-12 max-[560px]:grid-cols-1 max-[560px]:gap-y-10">
          
          {/* Brand */}
          <div className="min-w-0 max-w-[430px] max-[900px]:col-span-2 max-[560px]:col-span-1">
            <Link
              href="/"
              aria-label="Awaken With Meheck home"
              className="inline-flex"
            >
              <Image
                src="/images/logo/awaken.png"
                alt="Awaken with Meheck"
                width={145}
                height={112}
                className="h-auto w-[132px] object-contain mix-blend-multiply"
              />
            </Link>

            <p className="mt-6 mb-0 max-w-[405px] text-[13px] leading-[1.95] text-[#637067]">{description}</p>

            <NewsletterForm />

            <div className="mt-8 flex items-center gap-3 text-[#587060]">
              <LeafIcon />

              <div>
                <p className="m-0 text-[8px] font-bold tracking-[0.22em] text-[#476652] uppercase">
                  Awaken
                </p>

                <p className="mt-1 mb-0 text-[11px] tracking-[0.08em] text-[#6b796f]">
                  {tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Explore */}
          <FooterLinks title="Explore" links={explore} />

          {/* Help */}
          <FooterLinks title="Here to help" links={helpful} />

          {/* Visit */}
          <div className="min-w-0">
            <SectionTitle>{addressLines.length ? "Visit us" : "Contact"}</SectionTitle>

            {addressLines.length > 0 && <div className="flex items-start gap-3">
              <LocationIcon />

              <address className="not-italic text-[13px] leading-[1.9] text-[#5e6c62]">{addressLines.map((line, index) => <span key={line + index}>{line}{index < addressLines.length - 1 && <br />}</span>)}</address>
            </div>}

            {addressLines.length > 0 && <a
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              className="group mt-6 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.04em] text-[#42624f] transition-colors duration-300 hover:text-[#1f3a2f]"
            >
              Get directions
              <ArrowIcon />
            </a>}

            {(email || phone) && <div className="mt-4 grid gap-2 text-[12px] text-[#5e6c62]">
              {email && <a className="hover:underline" href={"mailto:" + email}>{email}</a>}
              {phone && <a className="hover:underline" href={"tel:" + phone.replace(/[^+\d]/g, "")}>{phone}</a>}
            </div>}

            {socialLinks.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#476652]">Follow us</p><div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px]">{socialLinks.map(({ key, label, href }) => (
              <a key={key} href={href} target="_blank" rel="noreferrer" className="text-[#42624f] hover:underline">{label}</a>
            ))}</div></div>}

            <div className="mt-8 h-px w-full max-w-[180px] bg-[#ced9ce]" />

            <p className="mt-6 max-w-[210px] text-[11px] leading-[1.8] text-[#7a867d]">{visitNote}</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex min-h-[64px] items-center justify-between gap-8 border-t border-[#d4ded2] text-[10px] text-[#758078] max-[640px]:flex-col max-[640px]:items-start max-[640px]:justify-center max-[640px]:gap-3 max-[640px]:py-5">
          <p className="m-0">
            {copyright}
          </p>

          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#8da08f]" />

            <span className="tracking-[0.07em] text-[#68766c]">
              Made for your wellbeing
            </span>

            <span className="h-[5px] w-[5px] rounded-full bg-[#56715f]" />

            <span className="h-px w-8 bg-gradient-to-r from-[#8da08f] to-transparent" />
          </div>
        </div>
      </div>
    </footer>
  );
}
