import Link from "next/link";
import { allPublicItems } from "@/lib/public-api";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { facilitatorProfileLink } from "@/lib/navigation-menu";

export const metadata = {
  title: "Our Facilitators | AwakenWithMeheck",
  description:
    "Meet the facilitators behind the practices, classes and workshops at AwakenWithMeheck.",
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
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-5 sm:px-8 sm:pt-7">
        {/* PAGE HEADING */}
        <header className="mb-8 max-w-2xl">
          <nav
            aria-label="Breadcrumb"
            className="hidden"
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

          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[#63856b]">
            Our community
          </p>

          <h1 className="font-[Georgia,serif] text-4xl leading-tight tracking-tight text-[#193b29] sm:text-5xl">
            Meet our facilitators
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#718076] sm:text-base">
            Discover the people guiding our
            classes, sessions and workshops.
          </p>
        </header>

        {/* Application promo intentionally omitted from the profile listing.
            <Link href="/dashboard/user/application" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#28563e] px-6 text-sm font-semibold text-white transition hover:bg-[#1c412e]">Apply Now <span aria-hidden="true" className="ml-2">→</span></Link>
        */}
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[#dfe9df] bg-gradient-to-b from-white to-[#f8fbf7] shadow-[0_8px_24px_rgba(38,74,48,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#bcd2c0] hover:shadow-[0_18px_38px_rgba(28,70,43,0.12)]"
                >
                  {/* PROFILE IMAGE */}
                  <div className="relative flex justify-center bg-[radial-gradient(circle_at_center,#f6faf2,#e4eee3)] px-5 py-8">
                    <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-[#dce9dc] shadow-[0_8px_20px_rgba(40,75,49,0.14)] transition duration-300 group-hover:scale-[1.03] [&_.api-media-gallery]:!h-full [&_.api-media-gallery]:!w-full [&_.api-media-asset]:!h-full [&_.api-media-asset]:!w-full [&_.api-media-asset]:!p-0 [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!bg-transparent [&_.api-media-asset_img]:!h-full [&_.api-media-asset_img]:!w-full [&_.api-media-asset_img]:!max-h-none [&_.api-media-asset_img]:!aspect-square [&_.api-media-asset_img]:!rounded-full [&_.api-media-asset_img]:!object-cover">
                      {profile ? (
                        <Link href={profile.href} prefetch={false} aria-label={`View ${name}'s profile`} className="block h-full w-full">
                          <RecordMedia record={person} compact imagesOnly />
                        </Link>
                      ) : <RecordMedia record={person} compact imagesOnly />}
                    </div>
                  </div>

                  {/* PROFILE INFORMATION */}
                  <div className="flex flex-1 flex-col p-6">
                    {role && (
                      <p className="mb-3 inline-flex w-fit rounded-full border border-[#d4e4d4] bg-[#eef6ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#557b5d]">
                        {role}
                      </p>
                    )}

                    <h3 className="font-[Georgia,serif] text-[26px] leading-tight tracking-[-0.02em] text-[#193b29]">
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
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#68776d]">
                        {description}
                      </p>
                    )}

                    <div className="mt-auto border-t border-[#e3ebe2] pt-5">
                      {profile ? (
                        <Link
                          href={profile.href}
                          prefetch={false}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#28563e] px-5 text-sm font-semibold !text-white shadow-[0_6px_16px_rgba(40,86,62,0.14)] transition hover:bg-[#1f4933] hover:!text-white hover:shadow-[0_9px_20px_rgba(40,86,62,0.2)]"
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
