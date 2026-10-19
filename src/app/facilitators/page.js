import Link from "next/link";
import { allPublicItems } from "@/lib/public-api";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { facilitatorProfileLink } from "@/lib/navigation-menu";
import { facilitatorPathways } from "@/data/facilitator-pathways";

export const metadata = {
  title: "Our Facilitators | Awaken With Meheck",
  description:
    "Meet the facilitators behind the practices, classes and workshops at Awaken With Meheck.",
};

function getName(person) {
  return (
    person.displayName ||
    person.name ||
    person.title ||
    "Facilitator"
  );
}

function getDescription(person) {
  return (
    person.shortBio ||
    person.shortDescription ||
    person.bio ||
    person.description ||
    ""
  );
}

export default async function FacilitatorsPage() {
  let response;

  try {
    response = await allPublicItems("facilitators");
  } catch (error) {
    console.error("[Facilitators]", error);

    response = {
      error: "Unable to retrieve facilitators.",
      data: [],
    };
  }

  const hasError = Boolean(response?.error);

  const rawPeople = Array.isArray(response?.data)
    ? response.data
    : [];

  // Avoid showing duplicate records with the same identity.
  const seen = new Set();

  const people = rawPeople.filter((person) => {
    if (!person || typeof person !== "object") return false;

    const identity =
      person.id ||
      person._id ||
      person.slug;

    if (!identity) return true;

    const key = String(identity);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  return (
    <main className="min-h-[65vh] bg-white text-[#263e30]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {/* PAGE HEADING */}
        <header className="mb-8 border-b border-[#e9eee8] pb-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-xs text-[#819087]"
          >
            <Link
              href="/"
              className="transition hover:text-[#28563e]"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="font-medium text-[#315a48]">
              Facilitators
            </span>
          </nav>

          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#63856b]">
            Our community
          </p>

          <h1 className="mt-2 font-[Georgia,serif] text-4xl leading-tight tracking-tight text-[#193b29] sm:text-5xl">
            Meet our facilitators
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#718076] sm:text-base">
            Discover the people guiding our
            classes, sessions and workshops.
          </p>
        </header>

        <section className="mb-12 rounded-2xl border border-[#dce6dc] bg-[#f4f6ef] p-6 sm:p-8" aria-labelledby="facilitator-options-title">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#63856b]">Facilitator options</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div><h2 id="facilitator-options-title" className="font-[Georgia,serif] text-3xl leading-tight text-[#193b29] sm:text-4xl">Train to facilitate with Awaken</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#718076]">Review the currently verified pathway requirements before starting your application.</p></div>
            <Link href="/dashboard/user/application" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#28563e] px-6 text-sm font-semibold text-white transition hover:bg-[#1c412e]">Apply Now <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
          <div className="mt-7 grid gap-4">{facilitatorPathways.map((pathway) => <article key={pathway.id} className="rounded-xl border border-[#dfe7dd] bg-white p-5 sm:p-6">
            <h3 className="font-[Georgia,serif] text-2xl text-[#203d2b]">{pathway.title}</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#66836d]">Required trainings</p><ul className="mt-3 flex flex-wrap gap-2">{pathway.trainings.map((training) => <li key={training} className="rounded-full border border-[#d4dfd3] bg-[#f7faf7] px-3 py-1.5 text-xs font-semibold text-[#315a48]">{training}</li>)}</ul></div><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#66836d]">Evaluation</p><p className="mt-3 text-sm leading-7 text-[#647368]">{pathway.evaluation}</p></div></div>
          </article>)}</div>
        </section>

        {/* RESULT STATUS */}
        {!hasError && people.length > 0 && (
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#284733]">
              Our guides
            </h2>

            <p className="text-xs text-[#839087]">
              {people.length}{" "}
              {people.length === 1
                ? "facilitator"
                : "facilitators"}
            </p>
          </div>
        )}

        {/* ERROR */}
        {hasError ? (
          <div
            role="alert"
            className="rounded-xl border border-[#eadbd4] bg-[#fff9f6] px-5 py-5"
          >
            <h2 className="font-semibold text-[#8e5042]">
              Unable to load facilitators
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#92685d]">
              Facilitator profiles are
              temporarily unavailable.
              Please try again later.
            </p>
          </div>
        ) : people.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-xl border border-[#e5ebe5] bg-[#fafbf9] px-6 py-12 text-center">
            <h2 className="font-[Georgia,serif] text-2xl text-[#294733]">
              No facilitators available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#748277]">
              There are no published facilitator
              profiles available right now.
            </p>
          </div>
        ) : (
          /* REAL FACILITATOR CARDS */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person, index) => {
              const profile =
                facilitatorProfileLink(person);

              const name = getName(person);

              const description =
                getDescription(person);

              const role =
                person.designation ||
                person.specialization ||
                person.role ||
                "";

              const key =
                person.id ||
                person._id ||
                person.slug ||
                `facilitator-${index}`;

              return (
                <article
                  key={key}
                  className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e4eae4] bg-white transition duration-200 hover:border-[#cbdcce] hover:shadow-[0_12px_32px_rgba(28,70,43,0.07)]"
                >
                  {/* PROFILE IMAGE */}
                  <div className="overflow-hidden bg-[#f7f9f6]">
                    {profile ? (
                      <Link
                        href={profile.href}
                        prefetch={false}
                        aria-label={`View ${name}'s profile`}
                        className="block"
                      >
                        <RecordMedia
                          record={person}
                          compact
                          imagesOnly
                        />
                      </Link>
                    ) : (
                      <RecordMedia
                        record={person}
                        compact
                        imagesOnly
                      />
                    )}
                  </div>

                  {/* PROFILE INFORMATION */}
                  <div className="flex flex-1 flex-col p-5">
                    {role && (
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#63856b]">
                        {role}
                      </p>
                    )}

                    <h3 className="font-[Georgia,serif] text-[23px] leading-snug text-[#203d2b]">
                      {profile ? (
                        <Link
                          href={profile.href}
                          prefetch={false}
                          className="transition hover:text-[#276343]"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </h3>

                    {description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#738076]">
                        {description}
                      </p>
                    )}

                    <div className="mt-auto pt-5">
                      {profile ? (
                        <Link
                          href={profile.href}
                          prefetch={false}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9e5dc] bg-[#f7faf7] px-5 text-sm font-semibold text-[#315a48] transition hover:border-[#bad1c0] hover:bg-[#edf5ee]"
                        >
                          View profile
                          <span aria-hidden="true">→</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-[#89948b]">
                          Profile unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
