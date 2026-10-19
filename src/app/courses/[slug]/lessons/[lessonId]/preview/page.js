import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { publicApi } from "@/lib/public-api";

export default async function LessonPreviewPage({ params }) {
  const { slug, lessonId } = await params;
  const back = `/courses/${encodeURIComponent(slug)}`;
  const result = await publicApi(`courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/preview`);
  if (result?.status === 404 || (!result?.error && !result?.data)) notFound();
  const lesson = result?.data && typeof result.data === "object" ? result.data : {};
  // The public preview/file endpoint can exist even when metadata has no media URL.
  const available = lesson.fileAvailable !== false;
  const fileUrl = `/api/public/files/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/preview/file`;
  const body = lesson.content || lesson.description || lesson.text;

  return <main className="min-h-screen bg-white text-[#20372d]">
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Link href={back} className="text-sm font-semibold text-[#315d44] hover:underline">← Back to course</Link>
      <header className="mt-8 border-b border-[#e4ebe4] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#729077]">Free lesson preview</p>
        <h1 className="mt-2 font-[Georgia,serif] text-3xl leading-tight sm:text-4xl">{lesson.title || lesson.name || "Lesson preview"}</h1>
        {body && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-[#687b6c]">{body}</p>}
      </header>
      {result?.error ? <p role="alert" className="mt-7 text-sm text-[#9d4f3c]">{String(result.error)}</p>
        : available ? <section className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-[#eef3ed] p-2 sm:p-3 [&_video]:w-full [&_audio]:w-full [&_iframe]:w-full [&_img]:max-w-full">
            <RecordMedia record={{ ...lesson, fileUrl }} />
          </div>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-[#2a5d40] underline underline-offset-4">Open lesson media in new tab ↗</a>
        </section> : !body ? <p className="mt-7 text-sm text-[#687b6c]">No preview content is available for this lesson.</p> : null}
    </div>
  </main>;
}
