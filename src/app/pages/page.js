import Link from "next/link";
import { allPublicItems } from "@/lib/public-api";

export const metadata = { title: "Website pages | Awaken With Me" };

export default async function PublicPagesIndex() {
  const result = await allPublicItems("pages");
  const pages = Array.isArray(result.data) ? result.data : [];
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Awaken</p><h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-5xl">Published pages</h1>
    {result.error ? <p role="alert" className="mt-8 rounded-lg bg-white p-6 text-[#8a4c3c]">{result.error}</p> : pages.length ? <ul className="mt-8 grid gap-3 sm:grid-cols-2">{pages.map((page) => <li key={page.id || page.slug} className="rounded-lg border border-[#dfe7dd] bg-white p-5"><Link href={"/" + encodeURIComponent(page.slug)} className="font-[Georgia,serif] text-xl text-[#315a48] hover:underline">{page.title || page.name || page.slug}</Link>{page.description && <p className="mt-2 text-sm leading-6 text-[#647368]">{page.description}</p>}</li>)}</ul> : <p className="mt-8 rounded-lg bg-white p-6 text-[#647368]">No additional pages have been published.</p>}
  </div></main>;
}
