import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";

export default async function CourseDemoPage({ params }) {
  const { slug } = await params;
  const result = await publicApi("courses/" + encodeURIComponent(slug) + "/demo");
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const demo = result.data && typeof result.data === "object" ? result.data : {};
  const fileAvailable = demo.fileAvailable === true || Boolean(demo.fileUrl || demo.mediaId || demo.videoUrl || demo.audioUrl);
  const description = demo.description || demo.content || demo.instructions;
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href={"/courses/" + encodeURIComponent(slug)} className="text-sm font-semibold text-[#315a48] hover:underline">← Back to course</Link>
    <h1 className="mt-10 font-[Georgia,serif] text-4xl">{demo.title || "Course preview"}</h1>
    {!result.error && fileAvailable && <><RecordMedia record={{ ...demo, fileUrl: "/api/public/files/courses/" + encodeURIComponent(slug) + "/demo/file" }} /><RecordDetails record={demo} publicView /></>}{result.error ? <p role="alert" className="mt-6 rounded-lg bg-white p-6 text-[#8a4c3c]">{result.error}</p> : <>
      {description && <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#647368]">{description}</p>}
      {fileAvailable && <a href={"/api/public/files/courses/" + encodeURIComponent(slug) + "/demo/file"} className="mt-8 inline-flex min-h-12 items-center rounded-md bg-[#315a48] px-6 text-sm font-semibold text-white hover:bg-[#254638]">Open course demo</a>}
    </>}
  </div></main>;
}
