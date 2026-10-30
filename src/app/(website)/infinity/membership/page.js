import Link from "next/link";
import MembershipPlanStatus from "@/components/user/membership/MembershipPlanStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Membership | AwakenWithMeheck",
  description: "Choose an AwakenWithMeheck membership plan.",
};

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-[#29473c] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/meditations"
          className="text-sm font-semibold text-[#315a48] hover:underline"
        >
          ← Back to meditations
        </Link>

        <header className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#728276]">
            AwakenWithMeheck membership
          </p>
          <h1 className="mt-3 font-[Georgia,serif] text-4xl text-[#263b2e] sm:text-5xl">
            Choose your membership
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#728276]">
            Select an available plan to access the membership benefits shown by the live catalogue.
          </p>
        </header>

        <div className="mt-10">
          <MembershipPlanStatus
            heading="Available membership plans"
            description="Plans, pricing and benefits are loaded from the current membership catalogue."
          />
        </div>
      </div>
    </main>
  );
}
