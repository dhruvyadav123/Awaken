
import Link from "next/link";
import { allPublicItems } from "@/lib/public-api";
import MembershipPurchaseButton from "./MembershipPurchaseButton";

import {
  availablePlan,
  plansFrom,
  planPrice,
  planPeriod,
  planBenefits,
} from "@/lib/membership-ui";

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function PlanCard({ plan }) {
  const title =
    plan.name ||
    plan.title ||
    "Membership";

  const description =
    plan.shortDescription ||
    plan.description ||
    plan.excerpt;

  const pricing = planPrice(plan);
  const period = planPeriod(plan);
  const benefits = planBenefits(plan);

  const detailsUrl = plan.slug
    ? `/infinity/membership/${encodeURIComponent(
        String(plan.slug)
      )}`
    : null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#e2e9e3] bg-white p-5 transition-colors hover:border-[#a7bdaa] sm:p-6">
      <h3 className="text-xl font-semibold tracking-tight text-[#233c2f]">
        {title}
      </h3>

      {description && (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6c7b70]">
          {description}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-[#244a36]">
          {pricing.current || "Price unavailable"}
        </span>

        {period && (
          <span className="text-xs text-[#77867a]">
            {period}
          </span>
        )}
      </div>

      {pricing.original && (
        <p className="mt-1 text-sm text-[#829084]">
          <span className="line-through">
            {pricing.original}
          </span>

          <span className="ml-2 text-[#315a48]">
            Discounted
          </span>
        </p>
      )}

      {benefits.length > 0 && (
        <ul className="mt-6 space-y-3 border-t border-[#edf0ed] pt-5">
          {benefits.map((benefit, index) => (
            <li
              key={`${benefit}-${index}`}
              className="flex items-start gap-3 text-sm leading-6 text-[#526456]"
            >
              <span
                className="shrink-0 font-bold text-[#3e7955]"
                aria-hidden="true"
              >
                ✓
              </span>

              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-7">
        {plan.id ? (
          <MembershipPurchaseButton planId={String(plan.id)} />
        ) : detailsUrl ? (
          <Link
            href={detailsUrl}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#315a48] px-4 text-sm font-semibold text-white hover:bg-[#254737]"
          >
            View details
            <Arrow />
          </Link>
        ) : (
          <p className="text-sm text-[#78857a]">
            This plan cannot be selected right now.
          </p>
        )}

        {detailsUrl && plan.id && (
          <Link
            href={detailsUrl}
            className="mt-3 flex justify-center gap-2 py-2 text-xs font-semibold text-[#315a48] hover:underline"
          >
            View full details
            <Arrow />
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function MembershipPlanStatus({
  heading = "Membership plans",
  description = "Choose a plan that suits your practice.",
  compact = false,
}) {
  let result;

  try {
    result = await allPublicItems(
      "membership-plans",
      { cache: "no-store" }
    );
  } catch (error) {
    result = {
      error:
        error?.message ||
        "Unable to load membership plans.",
    };
  }

  const plans = result?.error
    ? []
    : plansFrom(result?.data).filter(
        availablePlan
      );

  return (
    <section
      aria-labelledby="membership-plans-heading"
      className={compact
        ? "w-full rounded-[24px] border border-[#e3e9df] bg-white/90 px-4 py-7 text-[#29473c] shadow-[0_12px_36px_rgba(50,75,55,0.06)] sm:px-7 sm:py-9"
        : "w-full py-7 text-[#29473c]"}
    >
      <div className={compact
        ? "mb-7 text-center"
        : "mb-6 flex flex-wrap items-end justify-between gap-4"}>
        <div>
          <h2
            id="membership-plans-heading"
            className={compact
              ? "text-2xl font-semibold tracking-tight text-[#263b2e] sm:text-3xl"
              : "text-2xl font-semibold tracking-tight text-[#263b2e] sm:text-3xl"}
          >
            {heading}
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#728276]">
            {description}
          </p>
        </div>

        <Link
          href="/profile/membership"
          className={compact
            ? "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#315a48] hover:underline"
            : "inline-flex items-center gap-2 text-sm font-semibold text-[#315a48] hover:underline"}
        >
          My membership
          <Arrow />
        </Link>
      </div>

      {result?.error ? (
        <p
          role="alert"
          className="py-6 text-sm text-[#a15847]"
        >
          Membership plans could not be loaded.
          Please try again later.
        </p>
      ) : plans.length === 0 ? (
        <p className="py-8 text-sm text-[#728276]">
          No membership plans are currently available.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanCard
              key={
                plan.id ||
                plan.slug ||
                `plan-${index}`
              }
              plan={plan}
            />
          ))}
        </div>
      )}
    </section>
  );
}
