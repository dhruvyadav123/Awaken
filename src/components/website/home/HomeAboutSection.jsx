import Link from "next/link";
import Image from "next/image";
import { getCmsItems, getCmsPayload, getTextValue } from "@/lib/cms-content";
import { publicApi } from "@/lib/public-api";

export default async function HomeAboutSection() {
  const [records, pageResult] = await Promise.all([getCmsItems("sections"), publicApi("pages/about")]);
  const record = records.map(getCmsPayload).find((item) => item.key === "about-section");
  if (!record) return null;
  const heading = getTextValue(record, "heading", "title");
  const text = getTextValue(record, "text", "content", "description");
  if (!heading && !text) return null;
  const hero = pageResult.data?.blocks?.find((block) => block.type === "HERO");
  const imageId = record.imageMediaId || hero?.imageMediaId;
  const poster = imageId ? `/api/public/files/media/${encodeURIComponent(imageId)}/file` : "";

  return <section className="renew-section home-about-section" aria-labelledby="home-about-heading">
    <div className={poster ? "home-about-grid" : "home-about-copy"}>
      {poster && <div className="home-about-media relative overflow-hidden rounded-2xl">
        <Image src={poster} alt={record.altText || hero?.altText || heading} fill unoptimized sizes="(max-width: 760px) 100vw, 45vw" className="object-contain" />
      </div>}
      <div className="home-about-copy">
        <h2 id="home-about-heading">{heading}</h2>
        {text && <p className="whitespace-pre-line">{text}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-6">
          <Link href="/about" className="renew-text-link">Read more <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </div>
    </div>
  </section>;
}
