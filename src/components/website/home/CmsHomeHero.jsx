import Image from "next/image";
import Link from "next/link";
import { publicApi } from "@/lib/public-api";
import { getTextValue, safeLink } from "@/lib/cms-content";
import TransformationQuote from "./TransformationQuote";

export default async function CmsHomeHero() {
  const result = await publicApi("pages/home-hero-main");
  const page = result.data;
  const hero = page?.blocks?.find((block) => block.type === "HERO");
  if (!hero) return null;
  const image = hero.imageMediaId ? `/api/public/files/media/${encodeURIComponent(hero.imageMediaId)}/file` : "";
  const href = safeLink(hero.linkUrl);
  const label = getTextValue(hero, "linkLabel");

  return <section className="cms-home-hero" aria-labelledby="cms-home-title">
    <div className="cms-home-hero-copy">
      <p className="renew-kicker"></p>
      <TransformationQuote />
      {href && label && <Link className="renew-button" href={href}>{label}<span aria-hidden="true">&rarr;</span></Link>}
    </div>
    {image && <div className="cms-home-hero-image"><Image src={image} alt={hero.altText || hero.heading || page.title} fill priority unoptimized sizes="(max-width: 760px) 100vw, 55vw" /></div>}
  </section>;
}
