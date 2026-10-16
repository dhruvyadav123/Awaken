import { formatProductPrice } from "@/lib/product-format";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Globe2,
  UserRound,
  Video,
} from "lucide-react";

import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import { publicApi, validPage } from "@/lib/public-api";

export const metadata = {
  title: "Sessions | Awaken With Me",
  description:
    "Explore private mindfulness, yoga and wellbeing sessions.",
};

const GREEN = "#104F43";

function formatPrice(session) {
  return formatProductPrice(session) || "Price unavailable";
}

function SessionCard({ session }) {
  const title =
    session.title ||
    session.name ||
    session.label ||
    "Guided session";

  const description =
    session.shortDescription ||
    session.excerpt ||
    session.description ||
    "";

  const duration =
    session.durationMinutes ?? session.duration;

  const facilitator =
    session.facilitatorName ||
    session.facilitator?.name ||
    "Session facilitator";

  const isOnline =
    String(session.mode || "").toUpperCase() === "ONLINE";

  const price = formatPrice(session);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E7EBE7] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#BDD3C8] hover:shadow-[0_15px_45px_rgba(15,58,47,0.07)]">
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#EAF1EB] sm:h-48">
        <div className="absolute -left-12 -top-20 h-56 w-56 rounded-full bg-[#D7E5D8] blur-3xl" />
        <div className="absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-[#C8DCD0] blur-3xl" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white/65 shadow-sm">
          <CalendarDays
            size={34}
            strokeWidth={1.25}
            color={GREEN}
          />
        </div>

        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#175748] shadow-sm">
          {isOnline ? (
            <Video size={13} />
          ) : (
            <Globe2 size={13} />
          )}
          {isOnline ? "Online session" : session.mode || "Session"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#678576]">
            Private session
          </span>
          <span className="text-sm font-bold text-[#155343]">
            {price}
          </span>
        </div>

        <h2 className="font-[Georgia,serif] text-[23px] leading-[1.3] tracking-[-0.025em] text-[#172C26]">
          {title}
        </h2>

        {description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#738078]">
            {description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#61746A]">
          {duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={15} />
              {duration} min
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <UserRound size={15} />
            {facilitator}
          </span>
        </div>

        <div className="mt-auto pt-6">
          {session.slug ? (
            <Link
              href={`/sessions/${encodeURIComponent(session.slug)}`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#104F43] px-5 text-sm font-semibold text-white transition hover:bg-[#0B3E35]"
            >
              View session
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="flex h-11 items-center justify-center rounded-xl bg-[#EEF2EF] text-sm text-[#738078]">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function SessionsPage({ searchParams }) {
  const query = await searchParams;
  const page = validPage(query?.page);

  const [result, categories] = await Promise.all([
    publicApi("session-types", {
      page,
      limit: 20,
    }),
    getPublicCategories(),
  ]);

  const sessions = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.data?.items)
      ? result.data.items
      : [];

  const pages = Number(result.pagination?.pages) || 0;

  return (
    <main className="min-h-screen bg-white text-[#172C26]">
      <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-10 sm:px-8 lg:pt-14">
        <div className="max-w-[720px]">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#658A77]">
            Awaken With Me
          </span>

          <h1 className="mt-4 font-[Georgia,serif] text-[42px] leading-[1.12] tracking-[-0.035em] sm:text-[58px]">
            Find your moment of calm.
          </h1>

          <p className="mt-5 max-w-[590px] text-[15px] leading-7 text-[#738078]">
            Explore guided sessions designed to help you reconnect,
            find balance and make space for yourself.
          </p>
        </div>

        <div className="mt-9">
          <CategoryNavigation
            categories={categories.data || []}
            type="SESSION"
          />
        </div>

        {categories.error && (
          <p className="mt-4 text-sm text-[#98604E]">
            Session categories are currently unavailable.
          </p>
        )}

        <div className="mb-6 mt-12 flex items-end justify-between gap-4 border-b border-[#ECF0EC] pb-4">
          <div>
            <h2 className="font-[Georgia,serif] text-2xl tracking-tight">
              Available sessions
            </h2>
            <p className="mt-1 text-sm text-[#849087]">
              Choose a session to explore available times.
            </p>
          </div>

          {!result.error && (
            <span className="shrink-0 text-xs font-medium text-[#7A8B80]">
              {result.pagination?.total ?? sessions.length} sessions
            </span>
          )}
        </div>

        {result.error ? (
          <div role="alert" className="rounded-xl bg-[#FFF5F1] p-5 text-sm text-[#9A5745]">
            {result.error}
          </div>
        ) : sessions.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id || session.slug}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7EBE7] py-16 text-center">
            <CalendarDays
              className="mx-auto text-[#8FA99B]"
              size={32}
              strokeWidth={1.5}
            />
            <h3 className="mt-4 text-lg font-semibold">
              No sessions available
            </h3>
            <p className="mt-2 text-sm text-[#758379]">
              Please check back for upcoming sessions.
            </p>
          </div>
        )}

        {pages > 1 && (
          <nav
            aria-label="Session pages"
            className="mt-10 flex items-center justify-center gap-5"
          >
            {page > 1 && (
              <Link
                href={`/sessions?page=${page - 1}`}
                className="text-sm font-medium text-[#104F43] hover:underline"
              >
                Previous
              </Link>
            )}

            <span className="text-sm text-[#738078]">
              Page {page} of {pages}
            </span>

            {page < pages && (
              <Link
                href={`/sessions?page=${page + 1}`}
                className="text-sm font-medium text-[#104F43] hover:underline"
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
