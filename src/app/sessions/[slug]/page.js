import { formatProductPrice } from "@/lib/product-format";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Coffee,
  Globe2,
  MonitorPlay,
  UserRound,
  Video,
} from "lucide-react";

import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { publicApi } from "@/lib/public-api";
import SessionBookingPanel from "@/components/sessions/SessionBookingPanel";

function validISODate(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function getMonthRange(query) {
  const current = new Date();

  const defaultYear = current.getUTCFullYear();
  const defaultMonth = current.getUTCMonth() + 1;

  const from = validISODate(query?.from)
    ? query.from
    : `${defaultYear}-${String(defaultMonth).padStart(2, "0")}-01`;

  const parsed = new Date(`${from}T00:00:00.000Z`);
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;

  const lastDay = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Always fetch one complete calendar month.
  // Ignore arbitrary oversized or invalid 'to' values.
  return {
    year,
    month,
    from: first,
    to: last,
  };
}

function formatPrice(session) {
  return formatProductPrice(session) || "Price unavailable";
}

function DetailItem({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={21}
        strokeWidth={1.7}
        className="mt-0.5 shrink-0 text-[#BE7B38]"
      />

      <div>
        <p className="text-sm font-semibold leading-5 text-[#192C25]">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 text-[11px] leading-4 text-[#8A958D]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const result = await publicApi(
    `session-types/${encodeURIComponent(slug)}`
  );

  const session = result.data;

  return {
    title: session?.title
      ? `${session.title} | Awaken With Me`
      : "Session details | Awaken With Me",
    description:
      session?.shortDescription ||
      session?.description ||
      "Explore guided sessions and available booking times.",
  };
}

export default async function SessionTypePage({
  params,
  searchParams,
}) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const result = await publicApi(
    `session-types/${encodeURIComponent(slug)}`
  );

  if (result.status === 404 || (!result.error && !result.data)) notFound();
  if (result.error) return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-14 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href="/sessions" className="text-sm underline">Back to sessions</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">Session details</h1><p role="alert" className="mt-6">{result.error}</p><Link href={`/sessions/${encodeURIComponent(slug)}`} className="mt-4 inline-block text-sm underline">Try again</Link></div></main>;

  const session = result.data;

  const title =
    session.title ||
    session.name ||
    session.label ||
    "Guided session";

  const description =
    session.description ||
    session.shortDescription ||
    session.excerpt ||
    "";

  const facilitator =
    session.facilitatorName ||
    session.facilitator?.name ||
    "Session facilitator";

  const duration =
    session.durationMinutes ??
    session.duration ??
    null;

  const buffer =
    session.bufferMinutes ?? 0;

  const capacity =
    session.capacity ?? null;

  const timezone =
    session.timezone || "Asia/Kolkata";

  const isOnline =
    String(session.mode || "").toUpperCase() === "ONLINE";

  const price = formatPrice(session);

  const { year, month, from, to } = getMonthRange(query);

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const slotsResult = session.id
    ? await publicApi(
        `session-types/${encodeURIComponent(session.id)}/slots`,
        {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          page: 1,
          limit: 100,
        }
      )
    : {
        data: [],
        error: "Session ID is missing.",
      };

  const slots = Array.isArray(slotsResult.data)
    ? slotsResult.data
    : Array.isArray(slotsResult.data?.slots)
      ? slotsResult.data.slots
      : [];

  const rescheduleBookingId =
    typeof query?.reschedule === "string"
      ? query.reschedule
      : "";

  return (
    <main className="min-h-screen bg-white text-[#172C26]">
      <div className="mx-auto max-w-[1480px] px-5 pb-20 pt-8 sm:px-8 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs text-[#7D8981] sm:text-sm"
        >
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 transition hover:text-[#104F43]"
          >
            <ArrowLeft size={15} />
            Sessions
          </Link>

          <span>/</span>

          <span className="max-w-[250px] truncate text-[#324B3D] sm:max-w-none">
            {title}
          </span>
        </nav>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_410px] xl:gap-9">
          <div className="grid min-w-0 gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-8">
            {/* Session media */}
            <div className="relative min-w-0 overflow-hidden rounded-[20px] bg-[#EAF1EB]">
              <div className="relative h-[320px] sm:h-[460px] md:h-[660px] lg:h-[680px]">
                <div className="session-detail-media h-full w-full">
                  <RecordMedia
                    record={session}
                    imagesOnly
                  />
                </div>

                <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-[#E6F0E8] via-[#F0F3EB] to-[#D8E7DD]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/70 bg-white/40">
                    <MonitorPlay
                      size={42}
                      strokeWidth={1.1}
                      className="text-[#719A82]"
                    />
                  </div>
                </div>
              </div>

              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#184C3F] shadow-sm">
                {isOnline ? (
                  <Video size={14} />
                ) : (
                  <Globe2 size={14} />
                )}
                {isOnline
                  ? "Online session"
                  : session.mode || "Session"}
              </span>
            </div>

            {/* Session information */}
            <div className="min-w-0 py-2 md:pt-4">
              <span className="inline-flex items-center rounded-full bg-[#E8F4EB] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#205B46]">
                {capacity === 1
                  ? "PRIVATE SESSION"
                  : "GUIDED SESSION"}
              </span>

              <h1 className="mt-6 font-[Georgia,serif] text-[34px] leading-[1.13] tracking-[-0.035em] text-[#172C26] sm:text-[43px] lg:text-[39px] xl:text-[45px]">
                {title}
              </h1>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F2EA] text-[#23614B]">
                  <UserRound size={21} strokeWidth={1.5} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#22352B]">
                    {facilitator}
                  </p>

                  <span className="text-xs text-[#89958B]">
                    Facilitator
                  </span>
                </div>
              </div>

              {description && (
                <p className="mt-8 whitespace-pre-line text-[14px] leading-[1.9] text-[#68776D]">
                  {description}
                </p>
              )}

              <div className="my-8 h-px bg-[#E7ECE8]" />

              <div className="grid grid-cols-2 gap-x-4 gap-y-7">
                <DetailItem
                  icon={Clock3}
                  title={duration != null ? `${duration} min` : "Duration unavailable"}
                  subtitle="Session duration"
                />

                {buffer > 0 && (
                  <DetailItem
                    icon={Coffee}
                    title={`${buffer} min`}
                    subtitle="Buffer time"
                  />
                )}

                <DetailItem
                  icon={UserRound}
                  title={capacity != null ? String(capacity) : "Capacity unavailable"}
                  subtitle={
                    capacity === 1
                      ? "Person only"
                      : "Maximum participants"
                  }
                />

                <DetailItem
                  icon={isOnline ? Video : Globe2}
                  title={
                    isOnline
                      ? "Online session"
                      : session.venue || session.mode || "Session"
                  }
                  subtitle={
                    isOnline
                      ? "Join from anywhere"
                      : [session.city, session.state]
                          .filter(Boolean)
                          .join(", ")
                  }
                />
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <strong className="text-[38px] font-semibold tracking-[-0.05em] text-[#172C26]">
                  {price}
                </strong>

                {(session.discountPrice ?? session.price ?? session.regularPrice) != null && price !== "Price unavailable" && Number(session.discountPrice ?? session.price ?? session.regularPrice) === 0 && (
                  <span className="rounded-full bg-[#E0F3E5] px-4 py-2 text-xs font-semibold text-[#236443]">
                    Free session
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive calendar */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <SessionBookingPanel
              key={`${year}-${month}`}
              session={session}
              slots={slots}
              timezone={timezone}
              year={year}
              month={month}
              error={slotsResult.error || ""}
              rescheduleBookingId={rescheduleBookingId}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
