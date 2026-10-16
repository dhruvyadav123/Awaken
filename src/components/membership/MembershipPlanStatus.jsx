import Link from "next/link";
import { allPublicItems } from "@/lib/public-api";

export default async function MembershipPlanStatus() {
  const result = await allPublicItems("membership-plans");
  const plans = Array.isArray(result.data) ? result.data : [];
  if (result.error) return <div><p className="text-[17px] text-[#8f451c]">Membership availability could not be loaded.</p><p className="mt-1 text-[12px] leading-5 text-[#7b746e]">{result.error}</p></div>;
  if (!plans.length) return <div><p className="text-[17px] leading-tight text-[#8f451c]">Membership enrollment is currently closed.</p><p className="mt-1 text-[12px] leading-5 text-[#7b746e]">No membership plans are currently available.</p></div>;
  return <div className="w-full py-4"><p className="text-[17px] text-[#315a48]">Membership plans are available.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{plans.map((plan) => <article key={plan.id || plan.slug || plan.name} className="rounded-lg border border-[#eee3d7] bg-white p-4"><h2 className="font-[Georgia,serif] text-lg text-[#523c2b]">{plan.title || plan.name || "Membership plan"}</h2>{(plan.description || plan.excerpt) && <p className="mt-2 text-xs leading-5 text-[#7b746e]">{plan.description || plan.excerpt}</p>}{(plan.discountPrice ?? plan.regularPrice ?? plan.price) != null && <p className="mt-3 text-sm font-semibold text-[#8f451c]">{plan.currency || ""} {plan.discountPrice ?? plan.regularPrice ?? plan.price}{plan.billingPeriod ? " / " + plan.billingPeriod : ""}</p>}{plan.slug && <Link href={"/infinity/membership/" + encodeURIComponent(plan.slug)} className="mt-3 inline-block text-xs font-semibold text-[#315a48] hover:underline">Plan details →</Link>}</article>)}</div><p className="mt-3 text-xs text-[#7b746e]">Open a plan to review its details and activation option.</p></div>;
}
