import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";

export default async function LessonPreviewPage({ params }) {
  const { slug, lessonId } = await params;
  const result = await publicApi("courses/" + encodeURIComponent(slug) + "/lessons/" + encodeURIComponent(lessonId) + "/preview");
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const preview = result.data && typeof result.data === "object" ? result.data : {};
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href={"/courses/" + encodeURIComponent(slug)} className="text-sm font-semibold text-[#315a48] hover:underline">← Back to course</Link>
    {!result.error && preview.fileAvailable !== false && <><RecordMedia record={{ ...preview, fileUrl: "/api/public/files/courses/" + encodeURIComponent(slug) + "/lessons/" + encodeURIComponent(lessonId) + "/preview/file" }} /><RecordDetails record={preview} publicView /></>}{result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Lesson preview</p>
      <h1 className="mt-3 font-[Georgia,serif] text-4xl">{preview.title || preview.name || "Preview lesson"}</h1>
      {(preview.content || preview.description || preview.text) && <div className="mt-6 whitespace-pre-line text-base leading-8 text-[#647368]">{preview.content || preview.description || preview.text}</div>}
      <a href={"/api/public/files/courses/" + encodeURIComponent(slug) + "/lessons/" + encodeURIComponent(lessonId) + "/preview/file"} className="mt-8 inline-flex min-h-12 items-center rounded-md bg-[#315a48] px-6 text-sm font-semibold text-white hover:bg-[#254638]">Open lesson preview</a>
    </>}
  </article></main>;
}
