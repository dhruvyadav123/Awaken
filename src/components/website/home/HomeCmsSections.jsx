import Image from "next/image";

import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { getCmsItems, getCmsPayload, getTextValue, safeLink } from "@/lib/cms-content";
import { publicApi } from "@/lib/public-api";

export default async function HomeCmsSections() {
  const [sectionRecords, websiteResult] = await Promise.all([getCmsItems("sections"), publicApi("website")]);
  const websiteComponents = Array.isArray(websiteResult.data?.components) ? websiteResult.data.components : [];
  const resolvedSections = sectionRecords.length ? sectionRecords : websiteComponents.filter((item) => item.kind === "SECTION");
  const sections = resolvedSections
    .filter((item) => (!item.kind || item.kind === "SECTION") && item?.key !== "about-section" && item?.data?.key !== "about-section")
    .map((item) => ({ ...item, ...getCmsPayload(item) }))
    .filter((item) => item.key === "home" || item.key?.startsWith("home-") || item.pageSlug === "home" || item.pageSlug === "/")
    .filter((item) => getTextValue(item, "heading", "title") || getTextValue(item, "text", "description"));

  return <>
    {sections.map((section) => {
      const heading = getTextValue(section, "heading", "title");
      const text = getTextValue(section, "text", "description", "content");
      const linkLabel = getTextValue(section, "linkLabel");
      const href = safeLink(getTextValue(section, "linkUrl", "url"));
      const items = Array.isArray(section.items) ? section.items.filter((item) => item && typeof item === "object") : [];
      if (section.key === "home") {
        const image = section.imageMediaId ? `/api/public/files/media/${encodeURIComponent(section.imageMediaId)}/file` : "";
        return <section key={section.id || section.key} className="renew-section cms-home-section" aria-label={heading}>
          {image && <div className="cms-home-section-image"><Image src={image} alt={section.altText || heading} fill unoptimized sizes="(max-width: 760px) 100vw, 45vw" /></div>}
          <div className="cms-home-section-copy">
            {heading && <h2>{heading}</h2>}
            {text && <p className="whitespace-pre-line">{text}</p>}
            {href && linkLabel && <a href={href} className="renew-button">{linkLabel}<span aria-hidden="true">&rarr;</span></a>}
          </div>
        </section>;
      }
      return <section key={section.id || section.key || heading} className="renew-section" aria-label={heading || "Awaken section"}>
        <div className="renew-section-heading"><div><p className="renew-kicker">FROM AWAKEN</p>{heading && <h2>{heading}</h2>}</div>{text && <p>{text}</p>}</div>
        <RecordMedia record={section} />
        {items.length > 0 && <div className="renew-offerings">{items.map((item, index) => {
          const itemTitle = getTextValue(item, "title", "heading", "name") || "Explore";
          const itemText = getTextValue(item, "text", "description", "body");
          const itemHref = safeLink(item.linkUrl || item.url || item.href);
          const content = <><span className="renew-kicker">0{index + 1}</span><h3>{itemTitle}</h3>{itemText && <p>{itemText}</p>}{itemHref && <span className="renew-card-link">Explore <span aria-hidden="true">&rarr;</span></span>}</>;
          return itemHref ? <a key={item.id || itemTitle} className="renew-offering sage" href={itemHref}>{content}</a> : <article key={item.id || itemTitle} className="renew-offering sage">{content}</article>;
        })}</div>}
        {href && linkLabel && <a href={href} className="renew-text-link">{linkLabel} <span aria-hidden="true">&rarr;</span></a>}
      </section>;
    })}
  </>;
}
