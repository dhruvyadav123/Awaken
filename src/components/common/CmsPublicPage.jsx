import Link from "next/link";
import { RecordMedia } from "./ApiRecordDisplay";
import { getCmsPayload, getTextValue, safeLink } from "@/lib/cms-content";

export default function CmsPublicPage({ record }) {
  const page = getCmsPayload(record);
  const title = getTextValue(page, "title", "name", "heading") || "Awaken";
  const description = getTextValue(page, "description", "excerpt", "summary");
  const content = getTextValue(page, "content", "body", "text");
  const sections = Array.isArray(page.sections) ? page.sections : [];
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]">
    <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Awaken</p>
      <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">{title}</h1>
      {description && <p className="mt-5 max-w-3xl text-lg leading-8 text-[#647368]">{description}</p>}
      <RecordMedia record={page} />
      {content && <div className="mt-10 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{content}</div>}
      {sections.map((section, index) => {
        const heading = getTextValue(section, "heading", "title");
        const text = getTextValue(section, "text", "content", "body", "description");
        const href = safeLink(section.linkUrl || section.url || section.href);
        const label = getTextValue(section, "linkLabel", "label");
        return <section key={section.id || heading || index} className="mt-12 border-t border-[#dfe7dd] pt-9">
          {heading && <h2 className="font-[Georgia,serif] text-3xl">{heading}</h2>}
          <RecordMedia record={section} />
          {text && <p className="mt-4 whitespace-pre-line text-base leading-8 text-[#647368]">{text}</p>}
          {href && label && <Link href={href} className="mt-5 inline-block text-sm font-semibold text-[#315a48] hover:underline">{label} →</Link>}
        </section>;
      })}
    </article>
  </main>;
}
