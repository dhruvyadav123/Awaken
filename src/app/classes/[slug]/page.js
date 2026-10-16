import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPublicItems, publicApi, readableDate } from "@/lib/public-api";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("classes/" + encodeURIComponent(slug));
  return { title: (result.data?.seoTitle || result.data?.title || result.data?.name || "Class") + " | Awaken With Me", description: result.data?.seoDescription || result.data?.excerpt || result.data?.shortDescription || undefined };
}

export default async function ClassDetailPage({ params }) {
  const { slug } = await params;
  const [result, categoryResult] = await Promise.all([
    publicApi("classes/" + encodeURIComponent(slug)),
    allPublicItems("categories"),
  ]);
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const item = result.data;
  const category = Array.isArray(categoryResult.data) ? categoryResult.data.find((entry) => entry.id === item?.categoryId) : null;
  const description = item?.content || item?.description || item?.shortDescription || item?.excerpt;
  const details = [
    ["Format", item?.format || item?.mode],
    ["Level", item?.level],
    ["Duration", item?.duration],
    ["Starts", readableDate(item?.startsAt || item?.startDate)],
    ["Ends", readableDate(item?.endsAt || item?.endDate)],
    ["Location", item?.location],
  ].filter(([, value]) => typeof value === "string" || typeof value === "number");

  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]"><article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
    <Link href="/classes" className="text-sm font-semibold text-[#315a48] hover:underline">← Back to classes</Link>
    {result.error ? <p role="alert" className="mt-10 rounded-lg bg-white p-6 text-[#8a4c3c]">{result.error}</p> : <>
      <RecordMedia record={item} imagesOnly /><RecordDetails record={item} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt"]} /><header className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#66836d]">{category?.name || "Class"}</p>
        <h1 className="mt-4 font-[Georgia,serif] text-4xl leading-tight sm:text-6xl">{item.title || item.name}</h1>
        {(item.excerpt || item.shortDescription) && <p className="mt-5 text-lg leading-8 text-[#647368]">{item.excerpt || item.shortDescription}</p>}
      </header>
      {details.length > 0 && <dl className="mt-10 grid gap-4 rounded-lg border border-[#dfe7dd] bg-white p-6 sm:grid-cols-2">
        {details.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wider text-[#738075]">{label}</dt><dd className="mt-1 text-sm text-[#29473c]">{value}</dd></div>)}
      </dl>}
      {description && <div className="mt-10 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{description}</div>}
      <div className="mt-12 flex flex-wrap items-center gap-5 border-t border-[#dfe7dd] pt-8">{item.id && <Link href={`/profile/classes/${encodeURIComponent(item.id)}`} className="rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#254638]">Register or manage class</Link>}<Link href="/contact" className="font-semibold text-[#315a48] hover:underline">Ask about this class →</Link></div>
    </>}
  </article></main>;
}
