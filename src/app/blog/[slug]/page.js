import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Journal | Awaken With Me",
  description: "Reflections on mindful attention and shared practice.",
};

const entries = {
  "quiet-art-of-noticing": {
    category: "Notice",
    title: "The quiet art of noticing",
    description:
      "A gentle invitation to pause, look again, and find a little more room in the middle of an ordinary day.",
    image: "/images/home/blog.jpeg",
    imageAlt: "A calm scene inviting a moment of mindful reflection",
    readTime: "A 4-minute read",
    paragraphs: [
      "Some days seem to pass in a rush of small tasks. We move from one thing to the next, already thinking about what comes after. Noticing offers a small pause in that movement.",
      "It does not ask you to change the moment or make it meaningful. It simply asks you to meet what is already here: the warmth of a cup, the light across a wall, the feeling of your feet on the ground, or one easy breath arriving and leaving.",
      "Try choosing one ordinary moment today and giving it your full attention for a few seconds. There is nothing to get right. When your thoughts move on, gently notice that too, then return to what you can see, hear, or feel.",
      "Small moments of attention can make a day feel less like something to get through and more like a place you are actually living.",
    ],
    quote: "Attention can be a way of coming back to yourself.",
    closing: "Take one quiet moment with you.",
  },
  "practising-together": {
    category: "Connection",
    title: "The practice of being together",
    description:
      "A reflection on how shared moments can make space for listening, learning, and belonging.",
    image: "/images/home/home1.jpeg",
    imageAlt: "A group gathered together for a shared practice",
    readTime: "A 3-minute read",
    paragraphs: [
      "Practice can be quiet and personal, but it does not always have to happen alone. Sitting with others, sharing a thought, or simply listening can offer a different way to pay attention.",
      "Being together does not mean having the same story or reaching the same conclusion. It can mean making room for different perspectives without rushing to fix, compare, or explain them.",
      "A small way to begin is to listen to someone fully for a few minutes. Notice what changes when you give the conversation your attention, and when you let yourself be part of it too.",
    ],
    quote: "Connection begins with making room for one another.",
    closing: "Carry a little more curiosity into your next conversation.",
  },
};

export default async function JournalEntryPage({ params }) {
  const { slug } = await params;
  const entry = entries[slug];

  if (!entry) notFound();

  return (
    <main className="min-h-screen bg-[#f7f6f0] text-[#263b32]">
      <article className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#476750] transition hover:text-[#233e31]"
        >
          <span aria-hidden="true">←</span> Back to the journal
        </Link>

        <header className="mx-auto max-w-3xl py-12 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#738766]">
            {entry.category} · A journal reflection
          </p>
          <h1 className="mt-5 font-[Georgia,serif] text-4xl leading-tight text-[#254335] sm:text-6xl">
            {entry.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#5a685e] sm:text-lg">
            {entry.description}
          </p>
          <p className="mt-6 text-sm text-[#718075]">{entry.readTime}</p>
        </header>

        <div className="relative aspect-[16/9] overflow-hidden rounded-[6px] bg-[#e2e6d9]">
          <Image
            src={entry.image}
            alt={entry.imageAlt}
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
          />
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-7 font-[Georgia,serif] text-lg leading-[1.9] text-[#43534a] sm:mt-16 sm:text-xl">
          {entry.paragraphs.slice(0, 2).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <blockquote className="border-l-2 border-[#9ba98a] py-1 pl-6 text-2xl italic leading-relaxed text-[#365542] sm:text-3xl">
            {entry.quote}
          </blockquote>
          {entry.paragraphs.slice(2).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <footer className="mx-auto mt-14 flex max-w-2xl flex-col gap-5 border-t border-[#dfe3d8] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[Georgia,serif] text-lg text-[#4e6255]">
            {entry.closing}
          </p>
          <Link
            href="/meditations"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[4px] bg-[#315844] px-6 text-sm font-medium text-white transition hover:bg-[#234735]"
          >
            Begin a short practice <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </article>
    </main>
  );
}