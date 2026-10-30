import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import NewsletterForm from "@/components/common/NewsletterForm";
import { getCmsItems, getFooterConfig, getTextValue, safeLink } from "@/lib/cms-content";

const textLinkClass =
  "inline-flex w-fit items-center text-[14px] leading-[1.5] text-[#4D6255] transition-colors duration-200 hover:text-[#174F35] hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2C6946]";

function footerLinks(settings) {
  const entries = Array.isArray(settings?.links)
    ? settings.links
    : Array.isArray(settings?.items)
      ? settings.items
      : [];

  return entries
    .map((entry) => {
      const label = getTextValue(entry, "label", "title", "name");
      const href = safeLink(entry?.url || entry?.href || entry?.path, { allowExternal: true });
      return label && href ? { label, href } : null;
    })
    .filter(Boolean);
}

function FooterLink({ href, label }) {
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} className={textLinkClass} target="_blank" rel="noreferrer">{label}</a>;
  }

  return <Link href={href} className={textLinkClass}>{label}</Link>;
}

function FooterNav({ title, links }) {
  if (!links.length) return null;

  return (
    <nav aria-label={title} className="min-w-0">
      <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#233C2C]">{title}</h2>
      <ul className={`m-0 list-none p-0 ${links.length > 5 ? "grid grid-cols-2 gap-x-6 gap-y-3" : "flex flex-col gap-3"}`}>
        {links.map(({ href, label }) => (
          <li key={`${href}-${label}`}><FooterLink href={href} label={label} /></li>
        ))}
      </ul>
    </nav>
  );
}

function getAddressLines(address) {
  if (Array.isArray(address)) {
    return address.filter((line) => typeof line === "string" && line.trim()).map((line) => line.trim());
  }

  if (typeof address === "string") {
    return address.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  return [];
}

export default async function Footer({ website = {} }) {
  const footerRecords = await getCmsItems("footer-settings", { cache: "no-store" });
  const settings = getFooterConfig(footerRecords) || {};
  const links = footerLinks(settings);
  const general = website?.general || {};

  const description = getTextValue(
    settings,
    "text",
    "description",
    "aboutText",
    "footerDescription",
    "companyDescription"
  );
  const tagline = getTextValue(settings, "tagline", "brandTagline");
  const email = getTextValue(settings, "email", "contactEmail");
  const phone = getTextValue(settings, "phone", "contactPhone") || getTextValue(general, "supportPhone");
  const addressLines = getAddressLines(settings.address || settings.visitAddress);
  const visitNote = getTextValue(settings, "visitNote", "locationNote");
  const copyright = getTextValue(settings, "copyright", "copyrightText");
  const mapHref = addressLines.length
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`
    : "";
  const phoneHref = phone ? phone.replace(/[^+\d]/g, "") : "";
  const emailHref = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : "";

  return (
    <footer className="w-full border-t border-[#DFE8DF] bg-[#FAFCF9] text-[#263D2E]">
      <div className="mx-auto max-w-[1240px] px-5 pb-0 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pt-[70px]">
        <div className="grid grid-cols-2 gap-x-7 gap-y-11 pb-12 sm:gap-x-10 sm:pb-14 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 lg:pb-16">
          <div className="col-span-2 max-w-[440px] lg:col-span-5 lg:pr-10">
            <Link href="/" aria-label="AwakenWithMeheck home" className="inline-flex items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2C6946]">
              <Image src="/images/logo/awaken.png" alt="AwakenWithMeheck" width={145} height={112} sizes="145px" className="h-auto w-[130px] object-contain" />
            </Link>

            {tagline && <p className="mt-5 max-w-[420px] font-[Georgia,serif] text-[21px] leading-snug text-[#23422E]">{tagline}</p>}
            {description && <p className="mt-4 max-w-[410px] text-[14px] leading-[1.85] text-[#536759]">{description}</p>}
            <div className="mt-7 max-w-[410px]"><NewsletterForm /></div>
          </div>

          <div className="col-span-2 lg:col-span-4"><FooterNav title="Explore" links={links} /></div>

          <div className="col-span-2 min-w-0 lg:col-span-3">
            <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#233C2C]">Get in touch</h2>
            <div className="flex flex-col gap-4">
              {email && <div className="flex items-start gap-3"><Mail className="mt-0.5 shrink-0 text-[#547560]" size={17} strokeWidth={1.7} />{emailHref ? <a className={`${textLinkClass} break-all`} href={emailHref}>{email}</a> : <span className="break-all text-[14px] text-[#4D6255]">{email}</span>}</div>}
              {phone && <div className="flex items-start gap-3"><Phone className="mt-0.5 shrink-0 text-[#547560]" size={17} strokeWidth={1.7} />{phoneHref ? <a className={textLinkClass} href={`tel:${phoneHref}`}>{phone}</a> : <span className="text-[14px] text-[#4D6255]">{phone}</span>}</div>}
              {addressLines.length > 0 && <div className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-[#547560]" size={18} strokeWidth={1.7} /><div className="min-w-0"><address className="text-[14px] not-italic leading-[1.8] text-[#4D6255]">{addressLines.map((line, index) => <span className="block" key={`${line}-${index}`}>{line}</span>)}</address><a href={mapHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#245F3A] hover:underline hover:underline-offset-4">Get directions <ArrowUpRight size={14} /></a></div></div>}
            </div>
            {visitNote && addressLines.length > 0 && <p className="mt-4 text-[12px] leading-6 text-[#697D6E]">{visitNote}</p>}
          </div>
        </div>

        {copyright && <div className="border-t border-[#E0E8DF] py-5 text-[12px] text-[#5D7061] sm:py-6"><p className="m-0 leading-6">{copyright}</p></div>}
      </div>
    </footer>
  );
}
