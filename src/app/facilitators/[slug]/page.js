import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  RecordMedia,
  RecordDetails,
} from "@/components/common/ApiRecordDisplay";

import { publicApi } from "@/lib/public-api";

const getFacilitator = cache(async (slug) => {
  try {
    return await publicApi(
      `facilitators/${encodeURIComponent(slug)}`
    );
  } catch (error) {
    console.error(
      "[Facilitator Detail]",
      error
    );

    return {
      status: 503,
      error: "Facilitator profile unavailable.",
      data: null,
    };
  }
});

function getName(person) {
  return (
    person?.displayName ||
    person?.name ||
    person?.title ||
    "Facilitator"
  );
}

function getBiography(person) {
  return (
    person?.fullBio ||
    person?.bio ||
    person?.content ||
    person?.description ||
    person?.shortBio ||
    ""
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  if (!slug) {
    return {
      title: "Facilitator | Awaken With Meheck",
    };
  }

  const response = await getFacilitator(slug);
  const person = response?.data || {};

  return {
    title: `${
      person.seoTitle || getName(person)
    } | Awaken With Meheck`,

    description:
      person.seoDescription ||
      person.shortDescription ||
      person.shortBio ||
      person.description ||
      undefined,

    robots:
      response?.error || !response?.data
        ? { index: false, follow: false }
        : undefined,
  };
}

export default async function FacilitatorDetailPage({
  params,
}) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    notFound();
  }

  const response = await getFacilitator(slug);

  if (
    response?.status === 404 ||
    (!response?.error && !response?.data)
  ) {
    notFound();
  }

  const person = response?.data || {};

  const name = getName(person);

  const biography = getBiography(person);

  const shortDescription =
    person.shortDescription ||
    person.shortBio ||
    "";

  const role =
    person.designation ||
    person.specialization ||
    person.role ||
    "";

  return (
    <main className="min-h-[65vh] bg-white text-[#263e30]">
      <div className="mx-auto max-w-6xl px-5 pt-7 pb-14 sm:px-8 sm:pt-9 sm:pb-16">
        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#819087]"
        >
          <Link
            href="/"
            className="hover:text-[#28563e]"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href="/facilitators"
            className="hover:text-[#28563e]"
          >
            Facilitators
          </Link>

          <span aria-hidden="true">/</span>

          <span className="font-medium text-[#315a48]">
            {name}
          </span>
        </nav>

        {response?.error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#eadbd4] bg-[#fff9f6] p-6"
          >
            <h1 className="font-semibold text-[#8e5042]">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm leading-7 text-[#92685d]">
              We could not load this
              facilitator profile right now.
            </p>

            <Link
              href="/facilitators"
              className="mt-5 inline-block text-sm font-semibold text-[#315a48] underline"
            >
              Back to facilitators
            </Link>
          </div>
        ) : (
          <>
            {/* PROFILE HERO */}
            <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
              {/* IMAGE */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e5ebe5] bg-[#f8faf7]">
                <RecordMedia record={person} />
              </div>

              {/* PROFILE INTRO */}
              <div className="min-w-0 lg:pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#668b70]">
                  Awaken facilitator
                </p>

                <h1 className="mt-3 font-[Georgia,serif] text-4xl leading-[1.15] tracking-tight text-[#193b29] sm:text-5xl lg:text-6xl">
                  {name}
                </h1>

                {role && (
                  <p className="mt-4 text-sm font-semibold text-[#4d765a]">
                    {role}
                  </p>
                )}

                {shortDescription && (
                  <p className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[#718077]">
                    {shortDescription}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href={
                      "/contact?subject=" +
                      encodeURIComponent(
                        `Facilitator enquiry: ${name}`
                      )
                    }
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#28563e] px-6 text-sm font-semibold text-white transition hover:bg-[#1c412e]"
                  >
                    Enquire about a session
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    href="/facilitators"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dce7df] px-5 text-sm font-medium text-[#315a48] transition hover:bg-[#f5f8f5]"
                  >
                    All facilitators
                  </Link>
                </div>
              </div>
            </section>

            {/* BIOGRAPHY */}
            {biography && (
              <section className="mt-11 border-t border-[#e7ece7] pt-8">
                <div className="max-w-4xl">
                  <h2 className="font-[Georgia,serif] text-2xl text-[#203c2b] sm:text-3xl">
                    About {name}
                  </h2>

                  <div className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[#6e7a70]">
                    {biography}
                  </div>
                </div>
              </section>
            )}

            {/* BACKEND PROFILE DETAILS */}
            <section className="mt-9 border-t border-[#e7ece7] pt-8">
              <div className="max-w-4xl">
                <RecordDetails
                  record={person}
                  publicView
                  exclude={[
                    "id",
                    "_id",
                    "slug",
                    "title",
                    "name",
                    "displayName",
                    "description",
                    "shortDescription",
                    "shortBio",
                    "fullBio",
                    "bio",
                    "content",
                    "body",
                    "text",
                    "excerpt",
                    "designation",
                    "specialization",
                    "role",
                    "seoTitle",
                    "seoDescription",
                  ]}
                />
              </div>
            </section>

            {/* SIMPLE FOOTER NAVIGATION */}
            <div className="mt-10 border-t border-[#e7ece7] pt-6">
              <Link
                href="/facilitators"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a48] hover:underline"
              >
                ← Back to all facilitators
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}