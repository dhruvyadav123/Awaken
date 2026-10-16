import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import CourseEnrollmentAction from "@/components/learning/CourseEnrollmentAction";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPublicItems, publicApi, readableDate } from "@/lib/public-api";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("courses/" + encodeURIComponent(slug));
  const course = result.data || {};
  return { title: (course.seoTitle || course.title || course.name || "Course") + " | Awaken With Me", description: course.seoDescription || course.excerpt || course.description || undefined };
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const [result, languageResult, levelResult, reviewResult] = await Promise.all([
    publicApi("courses/" + encodeURIComponent(slug)),
    allPublicItems("languages"),
    allPublicItems("levels"),
    publicApi("courses/" + encodeURIComponent(slug) + "/reviews", { page: 1, limit: 10 }),
  ]);
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const course = result.data || {};
  const languageNames = (languageResult.data || []).filter((item) => [course.languageId, course.language, course.languageCode].includes(item.id) || [course.language, course.languageCode].includes(item.code)).map((item) => item.name);
  const levelNames = (levelResult.data || []).filter((item) => [course.levelId, course.level].includes(item.id) || [course.level, course.levelSlug].includes(item.slug)).map((item) => item.name);
  const reviews = Array.isArray(reviewResult.data) ? reviewResult.data.filter(review => review.content || review.comment || review.body || review.text) : [];
  const title = course.title || course.name || "Course";
  const description = course.content || course.description || course.shortDescription || course.excerpt;
  const demoAvailable = course.demoAvailable === true || course.hasDemo === true || Boolean(course.demoVideoUrl);
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]"><article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
    <Link href="/courses" className="text-sm font-semibold text-[#315a48] hover:underline">← All courses</Link>
    {result.error ? <p role="alert" className="mt-10 rounded-lg bg-white p-6 text-[#8a4c3c]">{result.error}</p> : <>
      <RecordMedia record={course} imagesOnly /><RecordDetails record={course} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt"]} /><header className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#66836d]">Awaken course</p><h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">{title}</h1>{(course.excerpt || course.shortDescription) && <p className="mt-5 text-lg leading-8 text-[#647368]">{course.excerpt || course.shortDescription}</p>}</header>
      {(languageNames.length || levelNames.length) > 0 && <p className="mt-5 text-sm text-[#738075]">{[...languageNames, ...levelNames].join(" · ")}</p>}
      {description && <div className="mt-9 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{description}</div>}
      {(course.startDate || course.duration || course.instructorName) && <dl className="mt-9 grid gap-4 rounded-lg border border-[#dfe7dd] bg-white p-6 sm:grid-cols-3">{course.startDate && <div><dt className="text-xs uppercase text-[#738075]">Starts</dt><dd className="mt-1 text-sm">{readableDate(course.startDate)}</dd></div>}{course.duration && <div><dt className="text-xs uppercase text-[#738075]">Duration</dt><dd className="mt-1 text-sm">{String(course.duration)}</dd></div>}{course.instructorName && <div><dt className="text-xs uppercase text-[#738075]">Facilitator</dt><dd className="mt-1 text-sm">{course.instructorName}</dd></div>}</dl>}
      <div className="mt-8 flex flex-wrap gap-3">{course.id && <CourseEnrollmentAction courseId={course.id} />}{demoAvailable && <Link href={"/courses/" + encodeURIComponent(slug) + "/demo"} className="inline-flex min-h-12 items-center rounded-md border border-[#315a48] px-6 text-sm font-semibold text-[#315a48] hover:bg-white">Preview this course</Link>}</div>
      {reviews.length > 0 && <section className="mt-14 border-t border-[#dfe7dd] pt-10"><h2 className="font-[Georgia,serif] text-3xl">Learner reviews</h2><div className="mt-6 grid gap-4">{reviews.map((review) => <blockquote key={review.id || review.title} className="rounded-lg bg-white p-5 text-sm leading-7 text-[#647368]"><p>{review.content || review.comment || review.body || review.text}</p>{(review.authorName || review.name) && <footer className="mt-3 text-xs font-semibold">{review.authorName || review.name}</footer>}</blockquote>)}</div></section>}
    </>}
  </article></main>;
}
