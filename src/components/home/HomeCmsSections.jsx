import { getCmsItems, getCmsPayload, getTextValue, safeLink } from "@/lib/cms-content";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { publicApi } from "@/lib/public-api";

export default async function HomeCmsSections() {
  const [brandRecords, faqRecords, sectionRecords, websiteResult] = await Promise.all([getCmsItems("brands"), getCmsItems("faqs"), getCmsItems("sections"), publicApi("website")]);
  const websiteComponents = Array.isArray(websiteResult.data?.components) ? websiteResult.data.components : [];
  const resolvedBrands = brandRecords.length ? brandRecords : websiteComponents.filter((item) => item.kind === "BRAND");
  const resolvedSections = sectionRecords.length ? sectionRecords : websiteComponents.filter((item) => item.kind === "SECTION");
  const brands = resolvedBrands
    .filter((item) => !item.kind || item.kind === "BRAND")
    .map((item) => ({ ...item, ...getCmsPayload(item) }))
    .filter((item) => getTextValue(item, "name", "brandName"));
  const liveFaqs = faqRecords
    .map((item) => getCmsPayload(item))
    .map((item) => [getTextValue(item, "question", "title", "label"), getTextValue(item, "answer", "content", "description", "body")])
    .filter(([question, answer]) => question && answer);
  const faqs = liveFaqs;
  const sections = resolvedSections
    .filter((item) => !item.kind || item.kind === "SECTION")
    .map((item) => ({ ...item, ...getCmsPayload(item) }))
    .filter((item) => getTextValue(item, "heading", "title") || getTextValue(item, "text", "description"));

  return <>
    {sections.map((section) => {
      const heading = getTextValue(section, "heading", "title");
      const text = getTextValue(section, "text", "description", "content");
      const linkLabel = getTextValue(section, "linkLabel");
      const href = safeLink(getTextValue(section, "linkUrl", "url"));
      const items = Array.isArray(section.items) ? section.items.filter((item) => item && typeof item === "object") : [];
      return <section key={section.id || section.key || heading} className="renew-section" aria-label={heading || "Awaken section"}>
        <div className="renew-section-heading"><div><p className="renew-kicker">FROM AWAKEN</p>{heading && <h2>{heading}</h2>}</div>{text && <p>{text}</p>}</div>
        <RecordMedia record={section} />
        {items.length > 0 && <div className="renew-offerings">{items.map((item, index) => {
          const itemTitle = getTextValue(item, "title", "heading", "name") || "Explore";
          const itemText = getTextValue(item, "text", "description", "body");
          const itemHref = safeLink(item.linkUrl || item.url || item.href);
          const content = <><span className="renew-kicker">0{index + 1}</span><h3>{itemTitle}</h3>{itemText && <p>{itemText}</p>}{itemHref && <span className="renew-card-link">Explore <span aria-hidden="true">→</span></span>}</>;
          return itemHref ? <a key={item.id || itemTitle} className="renew-offering sage" href={itemHref}>{content}</a> : <article key={item.id || itemTitle} className="renew-offering sage">{content}</article>;
        })}</div>}
        {href && linkLabel && <a href={href} className="renew-text-link">{linkLabel} <span aria-hidden="true">→</span></a>}
      </section>;
    })}
    {brands.length > 0 && <section className="renew-section" aria-labelledby="partners-title">
      <div className="renew-section-heading"><div><p className="renew-kicker">COMMUNITY &amp; PARTNERS</p><h2 id="partners-title">People we grow with.</h2></div><p>Meet the brands and partners connected with Awaken.</p></div>
      <div className="renew-offerings">{brands.map((brand) => {
        const name = getTextValue(brand, "name", "brandName");
        const href = safeLink(getTextValue(brand, "websiteUrl", "url"), { allowExternal: true });
        const content = <><RecordMedia record={brand} compact imagesOnly /><span className="renew-kicker">PARTNER</span><h3>{name}</h3><span className="renew-card-link">{href ? "Visit website" : "Awaken partner"}{href && <span aria-hidden="true"> →</span>}</span></>;
        return href
          ? <a className="renew-offering sage" href={href} key={brand.id || brand.key || name} target="_blank" rel="noreferrer">{content}</a>
          : <div className="renew-offering sage" key={brand.id || brand.key || name}>{content}</div>;
      })}</div>
    </section>}
    {faqs.length > 0 && <section className="renew-section renew-faq"><div><p className="renew-kicker">A LITTLE CLARITY</p><h2>New here?<br/><em>You’re welcome.</em></h2><p>A few things to help you find your way.</p></div><div>{faqs.map(([question, answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>}
  </>;
}
