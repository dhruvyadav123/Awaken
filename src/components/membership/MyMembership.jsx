"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { useApi, rowsOf } from "@/components/dashboard/data";
import { Pagination } from "@/components/dashboard/Elements";
import { externalUrl, titleOf } from "@/lib/learning-data";
import { formatProductPrice } from "@/lib/product-format";
import { allAccountPages, formatSchedule, requiredVersion } from "@/lib/student-flow";

const actionClass = "rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50";
export function MembershipDiscount({ courseId }) {
  const state = useApi(courseId ? `me/membership-discount?resourceType=COURSE&resourceId=${encodeURIComponent(courseId)}` : null);
  const discount = state.data;
  if (state.loading) return <p role="status" className="text-sm">Checking membership pricing…</p>;
  if (state.error) return <p role="alert" className="text-sm">{state.error} <button className="underline" onClick={state.reload}>Retry membership pricing</button></p>;
  if (!discount) return null;
  return <p className="rounded-lg bg-[#edf5ed] p-4 text-sm text-[#315a48]">{discount.included ? "Included with your membership." : `Membership discount: ${discount.membershipDiscountPercent ?? 0}%. Final price: ${formatProductPrice({ price: discount.finalAmount, currency: discount.currency })}.`}{discount.paymentRequired === false && " No payment required."} <Link href="/profile/membership" className="underline">View membership</Link></p>;
}

export default function MyMembership({ membershipId, planId: selectedPlanId }) {
  const query = useSearchParams();
  const planId = selectedPlanId || query.get("planId") || "";
  const [selectedPlan, setSelectedPlan] = useState(null), [planError, setPlanError] = useState("");
  useEffect(() => {
    if (!planId) return;
    let active = true;
    allAccountPages(accountFetch, "public/membership-plans", ["plans", "membershipPlans", "items"]).then(plans => {
      if (!active) return;
      const plan = plans.find(item => item.id === planId);
      setSelectedPlan(plan || null); setPlanError(plan ? "" : "The selected plan is unavailable. Choose a published plan from the membership page.");
    }).catch(caught => { if (active) setPlanError(caught.message); });
    return () => { active = false; };
  }, [planId]);
  const current = useApi(membershipId ? `me/membership/${encodeURIComponent(membershipId)}` : "me/membership");
  const [page, setPage] = useState(1);
  const history = useApi(`me/membership/history?page=${page}&limit=20`);
  const membership = current.data?.membership || (current.data?.id ? current.data : null);
  const memberships = rowsOf(current.data, ["memberships"]);
  const entries = rowsOf(history.data, ["history", "memberships"]);
  const [working, setWorking] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState(""), [reason, setReason] = useState(""), [receipt, setReceipt] = useState(null);
  const lock = useRef(false), keys = useRef({});
  const terminal = ["CANCELLED", "CANCELED", "EXPIRED"].includes(membership?.status);
  const keyFor = name => keys.current[name] ||= crypto.randomUUID();
  async function act(name) {
    if (lock.current) return;
    lock.current = true; setWorking(name); setError(""); setNotice("");
    try {
      if (name === "activate" && (!planId || selectedPlan?.id !== planId)) throw new Error("Select an available membership plan first.");
      if (name === "renew" && membership?.renewal?.eligible !== true) throw new Error("Renewal is not currently available for this membership.");
      const path = name === "activate" ? "me/membership/activate" : `me/membership/${encodeURIComponent(membership.id)}/${name}`;
      const body = name === "activate" ? { planId, idempotencyKey: keyFor(`activate-${planId}`) } : { version: requiredVersion(membership?.version, "membership"), ...(name === "renew" ? { idempotencyKey: keyFor(`renew-${membership.id}`) } : { reason: reason.trim() }) };
      if (name === "cancel" && !reason.trim()) throw new Error("Enter a cancellation reason.");
      const result = await accountFetch(path, { method: "POST", body });
      setReceipt(result.data); setNotice(result.message || "Membership request completed. Review the latest status below."); setReason("");
      if (name === "activate") delete keys.current[`activate-${planId}`];
      if (name === "renew") delete keys.current[`renew-${membership.id}`];
      await Promise.all([current.reload(), history.reload()]);
    } catch (caught) { setError(caught.message + (caught.status === 409 ? " Refresh membership details before retrying." : "")); }
    finally { lock.current = false; setWorking(""); }
  }
  const paymentLink = externalUrl(receipt?.payment) || externalUrl(receipt?.checkout);
  const orderId = receipt?.orderId || receipt?.order?.id || receipt?.period?.orderId;
  const loadError = current.status === 404 ? "" : current.error;
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link className="text-sm font-semibold underline" href="/profile">My account</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">My membership</h1><button className="mt-4 text-sm underline" disabled={current.loading || Boolean(working)} onClick={current.reload}>Refresh membership</button>
    {current.loading && <p role="status" className="mt-6">Loading membership…</p>}{(error || loadError) && <p role="alert" className="mt-6 rounded-lg bg-[#fff4f0] p-4">{error || loadError}</p>}{notice && <p role="status" className="mt-6 rounded-lg bg-[#edf5ed] p-4">{notice}</p>}
    {orderId && <Link className="mt-4 inline-block underline" href={`/profile/orders/${encodeURIComponent(orderId)}`}>View membership order and payment</Link>}{paymentLink && <a className="mt-4 block underline" href={paymentLink} target="_blank" rel="noopener noreferrer">Continue payment</a>}
    {!current.loading && !loadError && <div className="mt-8 space-y-6">{membership ? <section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">{titleOf(membership.plan, "Membership")}</h2><p className="mt-3">Status: {membership.status} · {membership.hasAccess ? "Access available" : "Access unavailable"}</p><p className="mt-2 text-sm">{membership.expiresAt && `Access until ${formatSchedule(membership.expiresAt)}`}</p>{membership.currentPeriod && <p className="mt-2 text-sm">Current period: {formatSchedule(membership.currentPeriod.startsAt)} — {formatSchedule(membership.currentPeriod.expiresAt)}</p>}<p className="mt-2 text-sm">Automatic renewal: {membership.autoRenew ? "Enabled" : "Disabled"}</p>{membership.plan?.benefits?.length > 0 && <ul className="mt-4 list-inside list-disc text-sm">{membership.plan.benefits.map((benefit, index) => <li key={index}>{typeof benefit === "string" ? benefit : benefit.title || benefit.description}</li>)}</ul>}{!membershipId && <Link className="mt-4 inline-block text-sm underline" href={`/profile/membership/${encodeURIComponent(membership.id)}`}>Manage membership</Link>}</section> : <p className="rounded-xl bg-white p-6">You do not have a current membership. <Link className="underline" href="/infinity/membership">Explore plans</Link></p>}
      {memberships.length > 1 && <section className="rounded-xl bg-white p-6"><h2 className="font-semibold">Your memberships</h2>{memberships.map(item => <Link key={item.id} className="mt-3 block text-sm underline" href={`/profile/membership/${encodeURIComponent(item.id)}`}>{item.plan?.name || "Membership"} · {item.status}</Link>)}</section>}
      {planId && <section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-xl">{selectedPlan?.name || "Activate selected plan"}</h2>{selectedPlan && <p className="mt-3 font-semibold">{formatProductPrice(selectedPlan)} ? {selectedPlan.durationDays} days</p>}{planError && <p role="alert" className="mt-3">{planError} <Link className="underline" href="/infinity/membership">Explore plans</Link></p>}<p className="mt-2 text-sm">Activation follows the selected plan&apos;s access and payment requirements.</p><button className={`${actionClass} mt-4`} disabled={Boolean(working) || selectedPlan?.id !== planId || Boolean(membership && !terminal)} onClick={() => act("activate")}>{working === "activate" ? "Activating…" : "Activate selected plan"}</button>{membership && !terminal && <p className="mt-3 text-sm">Manage your existing membership before selecting another plan.</p>}</section>}
      {membershipId && membership && <div className="grid gap-5 sm:grid-cols-2"><section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-xl">Renew</h2><p className="mt-2 text-sm">{membership.renewal?.eligible ? `${membership.renewal.durationDays} days · ${formatProductPrice({ price: membership.renewal.amount, currency: membership.renewal.currency })}${membership.renewal.paymentRequired ? " · Payment required" : " · No payment required"}` : "Renewal is not currently available."}</p><button className={`${actionClass} mt-4`} disabled={Boolean(working) || membership.version == null || membership.renewal?.eligible !== true} onClick={() => act("renew")}>{working === "renew" ? "Renewing…" : "Renew membership"}</button></section><form onSubmit={event => { event.preventDefault(); void act("cancel"); }} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-xl">Cancel membership</h2><label className="mt-3 block text-sm">Reason<textarea required maxLength={500} value={reason} disabled={Boolean(working) || terminal} onChange={event => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-[#cbd8cb] p-3" /></label><button className={`${actionClass} mt-4`} disabled={Boolean(working) || terminal || membership.version == null || !reason.trim()}>{working === "cancel" ? "Cancelling…" : "Confirm cancellation"}</button></form></div>}
    </div>}
    <section className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Membership history</h2>{history.loading && <p role="status" className="mt-4">Loading history…</p>}{history.error && <p role="alert" className="mt-4">{history.error} <button className="underline" onClick={history.reload}>Retry history</button></p>}{!history.loading && !history.error && (entries.length ? <ul className="mt-4 space-y-4">{entries.map(period => <li key={period.id} className="border-b border-[#dfe7dd] pb-3"><strong>{period.plan?.name || "Membership period"}</strong><p className="mt-2 text-sm">{period.operation} · {period.membershipStatus} · {period.paymentStatus}</p><p className="mt-2 text-sm">{formatSchedule(period.startsAt)} — {formatSchedule(period.expiresAt)}</p>{period.membershipId && <Link className="mt-2 inline-block text-sm underline" href={`/profile/membership/${encodeURIComponent(period.membershipId)}`}>View membership</Link>}</li>)}</ul> : <p className="mt-4 text-sm">No membership history yet.</p>)}<Pagination page={page} pagination={history.pagination} count={entries.length} loading={history.loading} onChange={setPage} /></section>
  </div></main>;
}
