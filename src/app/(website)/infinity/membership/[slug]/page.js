import { RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import MembershipPurchaseButton from "@/components/user/membership/MembershipPurchaseButton";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import { formatProductPrice } from "@/lib/product-format";

function effectivePrice(plan) {
  const raw = plan?.discountPrice ?? plan?.regularPrice ?? plan?.price;
  if (raw === null || raw === undefined || raw === "" || !Number.isFinite(Number(raw))) return null;
  return { amount: Number(raw), label: Number(raw) === 0 ? "Free" : formatProductPrice({ price: raw, currency: plan?.currency || "INR" }) };
}

function billingLabel(plan) {
  const billing = String(plan?.billingType || plan?.billingPeriod || "").toUpperCase();
  const labels = { MONTHLY: "Monthly", MONTH: "Monthly", YEARLY: "Yearly", ANNUAL: "Yearly", WEEKLY: "Weekly", WEEK: "Weekly", DAILY: "Daily", ONE_TIME: "One-time" };
  return labels[billing] || "";
}

function benefitLabels(plan) {
  const benefits = Array.isArray(plan?.benefits)
    ? plan.benefits.map((benefit) => typeof benefit === "string" ? benefit : benefit?.title || benefit?.name || benefit?.text || benefit?.description || "").filter(Boolean)
    : [];
  if (plan?.premiumMeditationAccess === true) benefits.push("Premium meditation access");
  for (const [field, title] of [["courseDiscountPercent", "courses"], ["classDiscountPercent", "classes"], ["sessionDiscountPercent", "sessions"], ["productDiscountPercent", "products"]]) {
    const percent = Number(plan?.[field]);
    if (Number.isFinite(percent) && percent > 0) benefits.push(`${percent}% off ${title}`);
  }
  return [...new Set(benefits)];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("membership-plans/" + encodeURIComponent(slug));
  return { title: (result.data?.title || result.data?.name || "Membership plan") + " | AwakenWithMeheck" };
}

export default async function MembershipPlanPage({ params }) {
  const { slug } = await params;
  const result = await publicApi("membership-plans/" + encodeURIComponent(slug));
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const plan = result.data || {};
  const price = effectivePrice(plan);
  const billing = billingLabel(plan);
  const benefits = benefitLabels(plan);
  const durationDays = Number(plan.durationDays);
  const hasDiscount = price && plan.discountPrice != null && plan.regularPrice != null && Number(plan.regularPrice) > price.amount;
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-14 text-[#282320] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/infinity/membership" className="text-sm font-semibold text-[#315a48] hover:underline">← All membership information</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <h1 className="mt-10 font-[Georgia,serif] text-4xl">{plan.title || plan.name || "Membership plan"}</h1>
      {(plan.description || plan.content) && <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#746e69]">{plan.description || plan.content}</p>}
      {price && <div className="mt-7 rounded-xl border border-[#e4e9e3] bg-white p-5"><div className="flex flex-wrap items-baseline gap-2"><span className="text-2xl font-semibold text-[#8f451c]">{price.label}</span>{billing && <span className="text-sm text-[#746e69]">{billing}</span>}</div>{hasDiscount && <p className="mt-2 text-sm text-[#746e69]"><span className="line-through">{formatProductPrice({ price: plan.regularPrice, currency: plan.currency || "INR" })}</span> <span className="ml-2 text-[#47755a]">Discounted price</span></p>}{durationDays > 0 && <p className="mt-2 text-sm text-[#746e69]">{durationDays} days membership access</p>}</div>}
      {benefits.length > 0 && <section className="mt-8"><h2 className="font-[Georgia,serif] text-2xl">What&apos;s included</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{benefits.map((benefit, index) => <li key={`${index}-${benefit}`} className="rounded-md bg-white p-4 text-sm text-[#5e584f]">{benefit}</li>)}</ul></section>}
      <RecordDetails record={plan} publicView exclude={["description", "content", "benefits", "regularPrice", "discountPrice", "currency", "billingType", "billingPeriod", "durationDays", "premiumMeditationAccess", "courseDiscountPercent", "classDiscountPercent", "sessionDiscountPercent", "productDiscountPercent", "selectedCourseIds", "selectedClassIds"]} />
      {plan.id && <MembershipPurchaseButton planId={String(plan.id)} className="mt-8 sm:w-auto sm:px-6" />}
      <p className="mt-6 text-sm text-[#746e69]">Review the plan terms and any payment instructions before completing activation. <Link className="font-semibold text-[#315a48] hover:underline" href="/contact">Ask Awaken a question</Link>.</p>
    </>}
  </article></main>;
}
