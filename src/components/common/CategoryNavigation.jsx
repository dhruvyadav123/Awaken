import Link from "next/link";
import { categoriesForType, categoryCatalogs } from "@/lib/public-categories";

export default function CategoryNavigation({ categories = [], type, activeSlug }) {
  const catalog = categoryCatalogs[type];
  const entries = categoriesForType(categories, type);
  if (!catalog || !entries.length) return null;
  const classes = "rounded-full border border-[#dfe7dd] bg-white px-3 py-1.5 text-xs text-[#54714b] transition hover:border-[#9db79b] hover:bg-[#f1f6ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb2d0] aria-[current=page]:border-[#315a48] aria-[current=page]:bg-[#315a48] aria-[current=page]:font-semibold aria-[current=page]:text-white";
  return <nav aria-label={`${catalog.label} categories`} className="flex flex-wrap gap-2">
    <Link href={catalog.path} prefetch={false} className={classes} aria-current={!activeSlug ? "page" : undefined}>All {catalog.label === "Shop" ? "products" : catalog.label.toLowerCase()}</Link>
    {entries.map((item) => <Link key={item.id} href={`${catalog.path}/category/${encodeURIComponent(item.slug)}`} prefetch={false} className={classes} aria-current={activeSlug === item.slug ? "page" : undefined}>{item.name}</Link>)}
  </nav>;
}
