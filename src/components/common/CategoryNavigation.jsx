import Link from "next/link";
import { categoriesForType, categoryCatalogs } from "@/lib/public-categories";

export default function CategoryNavigation({ categories = [], type, activeSlug }) {
  const catalog = categoryCatalogs[type];
  const entries = categoriesForType(categories, type);
  if (!catalog || !entries.length) return null;
  const classes = "border-b border-transparent py-2 text-sm text-[#315a48] hover:border-[#315a48] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb2d0] aria-[current=page]:border-[#315a48] aria-[current=page]:font-semibold";
  return <nav aria-label={`${catalog.label} categories`} className="flex flex-wrap gap-x-6 gap-y-2">
    <Link href={catalog.path} prefetch={false} className={classes} aria-current={!activeSlug ? "page" : undefined}>All {catalog.label === "Shop" ? "products" : catalog.label.toLowerCase()}</Link>
    {entries.map((item) => <Link key={item.id} href={`${catalog.path}/category/${encodeURIComponent(item.slug)}`} prefetch={false} className={classes} aria-current={activeSlug === item.slug ? "page" : undefined}>{item.name}</Link>)}
  </nav>;
}
