import Link from "next/link";
import { notFound } from "next/navigation";

import FacilitatorDetailPage, {
  loadFacilitatorPage,
} from "@/components/website/facilitators/FacilitatorDetailPage";

function getName(person) {
  return (
    person?.displayName ||
    person?.name ||
    person?.title ||
    "Facilitator profile"
  );
}

function getDescription(person) {
  return (
    person?.seoDescription ||
    person?.shortDescription ||
    person?.shortBio ||
    person?.description ||
    undefined
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    return {
      title: "Facilitator | AwakenWithMeheck",
    };
  }

  const result = await loadFacilitatorPage(slug, { includeCatalogues: false });
  const person = result?.person;

  return {
    title: `${person?.seoTitle || getName(person)} | AwakenWithMeheck`,
    description: getDescription(person),
    robots:
      result?.facilitatorResult?.error || !person
        ? { index: false, follow: false }
        : undefined,
  };
}

export default async function FacilitatorDetailRoute({ params }) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string" || !slug.trim()) {
    notFound();
  }

  const result = await loadFacilitatorPage(slug);

  if (
    result?.facilitatorResult?.status === 404 ||
    (!result?.facilitatorResult?.error && !result?.person)
  ) {
    notFound();
  }

  if (result?.facilitatorResult?.error) {
    return (
      <main className="min-h-[65vh] bg-white text-[#263e30]">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-9 sm:px-8">
          <p
            role="alert"
            className="rounded-2xl border border-[#eadbd4] bg-[#fff9f6] px-6 py-7 text-sm leading-7 text-[#8e5042]"
          >
            We could not load this facilitator profile right now. Please try
            again later.
          </p>
          <Link
            href="/facilitators"
            className="mt-6 inline-flex text-sm font-semibold text-[#315a48] underline-offset-4 hover:underline"
          >
            Back to facilitators
          </Link>
        </div>
      </main>
    );
  }

  return (
    <FacilitatorDetailPage
      person={result.person}
      catalogues={result.catalogues}
    />
  );
}
