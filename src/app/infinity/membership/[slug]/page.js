import { RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("membership-plans/" + encodeURIComponent(slug));
  return { title: (result.data?.title || result.data?.name || "Membership plan") + " | Awaken With Me" };
}

export default async function MembershipPlanPage({ params }) {
  const { slug } = await params;
  const result = await publicApi("membership-plans/" + encodeURIComponent(slug));
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const plan = result.data || {};
  const benefits = Array.isArray(plan.benefits) ? plan.benefits : Array.isArray(plan.features) ? plan.features : [];
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-14 text-[#282320] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/infinity/membership" className="text-sm font-semibold text-[#315a48] hover:underline">← All membership information</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <h1 className="mt-10 font-[Georgia,serif] text-4xl">{plan.title || plan.name || "Membership plan"}</h1>
      {(plan.description || plan.content) && <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#746e69]">{plan.description || plan.content}</p>}
      {(plan.discountPrice ?? plan.regularPrice ?? plan.price) != null && <p className="mt-6 text-lg font-semibold text-[#8f451c]">{plan.currency || ""} {plan.discountPrice ?? plan.regularPrice ?? plan.price}{plan.billingPeriod ? " / " + plan.billingPeriod : ""}</p>}
      <RecordDetails record={plan} publicView exclude={["description", "benefits"]} />{benefits.length > 0 && <ul className="mt-8 grid gap-3">{benefits.map((benefit, index) => <li key={index} className="rounded-md bg-white p-4 text-sm text-[#5e584f]">{typeof benefit === "string" ? benefit : benefit.title || benefit.text || benefit.description}</li>)}</ul>}
      {plan.id && <Link href={`/profile/membership?planId=${encodeURIComponent(plan.id)}`} className="mt-8 inline-flex rounded-md bg-[#315a48] px-6 py-3 text-sm font-semibold text-white">Activate this plan</Link>}
      <p className="mt-6 text-sm text-[#746e69]">Review the plan terms and any payment instructions before completing activation. <Link className="font-semibold text-[#315a48] hover:underline" href="/contact">Ask Awaken a question</Link>.</p>
    </>}
  </article></main>;
}
