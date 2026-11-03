"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useNotifications } from "@/components/common/NotificationCenter";
import { accountFetch } from "@/lib/client-account";
import { State, Badge, Pagination } from "./Elements";
import { useApi, rowsOf, idOf, money, date } from "./data";

const PAGE_SIZE = 20;
const payoutListPath = page => `facilitator/payout-requests?page=${page}&limit=${PAGE_SIZE}`;
const emptyForm = { currency: "INR", amount: "", accountHolderName: "", bankName: "", accountNumber: "", routingCode: "", country: "IN" };

function requestKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `payout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function unwrap(data) { return data?.payoutRequest || data?.payout || data?.request || data?.data || data || null; }
function payoutStatus(record) { return String(record?.status || record?.state || record?.payoutStatus || "PENDING").toUpperCase(); }
function payoutAmount(record) { return record?.amount ?? record?.requestedAmount ?? record?.netAmount ?? record?.grossAmount; }
function payoutLabel(record) { return record?.reference || record?.requestNumber || idOf(record) || "Payout request"; }
function methodLabel(record) { return String(record?.payoutMethod || record?.method || "BANK_TRANSFER").replaceAll("_", " "); }
function updateField(setForm, key, value) { setForm(current => ({ ...current, [key]: value })); }

function SectionSummary({ number, title, description }) {
  return <><span className="ws-payout-step">{number}</span><span className="ws-payout-summary-copy"><strong>{title}</strong><small>{description}</small></span><span className="ws-payout-chevron" aria-hidden="true">⌄</span></>;
}

function PayoutForm({ onCreated, onCancel }) {
  const notifications = useNotifications();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const intentKey = useRef("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const amount = Number(form.amount);
    const required = ["accountHolderName", "bankName", "accountNumber", "routingCode", "country"];
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter a payout amount greater than zero.");
    const missing = required.find(key => !String(form[key] || "").trim());
    if (missing) return setError(`${missing.replace(/([A-Z])/g, " $1").replace(/^./, value => value.toUpperCase())} is required.`);

    setBusy(true);
    setError("");
    try {
      intentKey.current ||= requestKey();
      const result = await accountFetch("facilitator/payout-requests", {
        method: "POST",
        body: {
          currency: form.currency,
          amount,
          idempotencyKey: intentKey.current,
          payoutMethod: "BANK_TRANSFER",
          account: {
            accountHolderName: form.accountHolderName.trim(),
            bankName: form.bankName.trim(),
            accountNumber: form.accountNumber.trim(),
            routingCode: form.routingCode.trim(),
            country: form.country.trim().toUpperCase(),
          },
        },
      });
      intentKey.current = "";
      notifications.success(result.message || "Your payout request was submitted.", { title: "Payout request created" });
      await onCreated(unwrap(result.data));
      setForm(emptyForm);
    } catch (caught) {
      setError(caught.message || "We could not submit the payout request.");
      notifications.error(caught.message || "We could not submit the payout request.", { title: "Payout request failed" });
    } finally {
      setBusy(false);
    }
  }

  return <section className="ws-payout-form-card" aria-labelledby="payout-form-title">
    <div className="ws-payout-form-heading"><div><p className="ws-eyebrow">SECURE BANK TRANSFER</p><h2 id="payout-form-title">New payout request</h2><p>Enter the amount and account details exactly as registered with your bank.</p></div><button type="button" className="ws-secondary" onClick={onCancel} disabled={busy}>Close</button></div>
    {error && <p className="ws-alert" role="alert">{error}</p>}
    <form onSubmit={submit}>
      <details className="ws-payout-accordion" open>
        <summary><SectionSummary number="01" title="Transfer details" description="Amount, currency and payout method" /></summary>
        <div className="ws-payout-accordion-body"><div className="ws-payout-form-grid">
          <label className="ws-field">Currency<select className="ws-input" value={form.currency} onChange={event => updateField(setForm, "currency", event.target.value)}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option></select></label>
          <label className="ws-field">Amount<input className="ws-input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={event => updateField(setForm, "amount", event.target.value)} placeholder="0.00" /></label>
          <label className="ws-field">Payout method<select className="ws-input" value="BANK_TRANSFER" disabled><option value="BANK_TRANSFER">Bank transfer</option></select><small>Available method from the payout API.</small></label>
        </div></div>
      </details>
      <details className="ws-payout-accordion" open>
        <summary><SectionSummary number="02" title="Bank account details" description="The account that will receive the transfer" /></summary>
        <div className="ws-payout-accordion-body"><div className="ws-payout-form-grid">
          <label className="ws-field">Account holder name<input className="ws-input" autoComplete="name" required value={form.accountHolderName} onChange={event => updateField(setForm, "accountHolderName", event.target.value)} /></label>
          <label className="ws-field">Bank name<input className="ws-input" autoComplete="organization" required value={form.bankName} onChange={event => updateField(setForm, "bankName", event.target.value)} /></label>
          <label className="ws-field">Account number<input className="ws-input" inputMode="numeric" autoComplete="off" required value={form.accountNumber} onChange={event => updateField(setForm, "accountNumber", event.target.value)} /></label>
          <label className="ws-field">Routing / IFSC code<input className="ws-input" autoComplete="off" required value={form.routingCode} onChange={event => updateField(setForm, "routingCode", event.target.value.toUpperCase())} /></label>
          <label className="ws-field">Country<select className="ws-input" value={form.country} onChange={event => updateField(setForm, "country", event.target.value)}><option value="IN">IN · India</option><option value="US">US · United States</option><option value="GB">GB · United Kingdom</option><option value="AE">AE · United Arab Emirates</option></select></label>
        </div></div>
      </details>
      <details className="ws-payout-accordion ws-payout-review-accordion">
        <summary><SectionSummary number="03" title="Review & safety" description="How duplicate requests are prevented" /></summary>
        <div className="ws-payout-accordion-body"><div className="ws-payout-safety"><span aria-hidden="true">✓</span><p>A unique idempotency key is generated automatically for this submission. If the request needs to be retried, the same key protects you from duplicate payout requests.</p></div></div>
      </details>
      <div className="ws-payout-form-actions"><button className="ws-button" disabled={busy}>{busy ? "Submitting…" : "Submit payout request"}</button><button type="button" className="ws-secondary" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>
  </section>;
}

function PayoutStats({ records, pagination }) {
  const total = pagination?.total ?? pagination?.totalItems ?? records.length;
  const pending = records.filter(record => ["PENDING", "PROCESSING", "UNDER_REVIEW", "PENDING_REVIEW"].includes(payoutStatus(record))).length;
  const latest = records[0];
  return <div className="ws-payout-stats">
    <article><span className="ws-payout-stat-icon">↗</span><div><small>Total requests</small><strong>{Number(total).toLocaleString("en-IN")}</strong><p>All submitted requests</p></div></article>
    <article><span className="ws-payout-stat-icon is-warm">◷</span><div><small>In review</small><strong>{pending.toLocaleString("en-IN")}</strong><p>Waiting for processing</p></div></article>
    <article><span className="ws-payout-stat-icon is-soft">₹</span><div><small>Latest request</small><strong>{latest ? money(payoutAmount(latest), latest.currency || "INR") : "—"}</strong><p>{latest ? date(latest.createdAt || latest.requestedAt || latest.submittedAt) : "No request yet"}</p></div></article>
  </div>;
}

function PayoutHero({ onNew }) {
  return <section className="ws-payout-hero"><div className="ws-payout-hero-copy"><p className="ws-payout-hero-kicker">FACILITATOR PAYOUTS</p><h2>Move your earnings<br /><em>with confidence.</em></h2><p>Request a secure bank transfer, track every payout, and keep your payment history in one clear place.</p><button className="ws-payout-hero-button" onClick={onNew}>Start a payout request <span aria-hidden="true">→</span></button></div><div className="ws-payout-hero-art" aria-hidden="true"><div className="ws-payout-orbit ws-payout-orbit-one" /><div className="ws-payout-orbit ws-payout-orbit-two" /><div className="ws-payout-hero-card"><span>TRANSFER CENTER</span><strong>₹</strong><small>Bank transfer</small></div></div></section>;
}

function PayoutDetail({ record }) {
  const account = record?.account || record?.bankAccount || {};
  const status = payoutStatus(record);
  const failed = ["FAILED", "REJECTED", "CANCELLED", "CANCELED"].includes(status);
  const completed = ["PAID", "COMPLETED", "SUCCESS", "SUCCEEDED"].includes(status);
  const stages = completed ? ["Request received", "Review completed", "Transfer completed"] : failed ? ["Request received", "Request requires attention"] : ["Request received", "Review in progress", "Transfer pending"];
  return <div className="ws-payout-detail-stack"><div className="ws-payout-detail-top"><div><p className="ws-eyebrow">PAYOUT REQUEST</p><h2>{payoutLabel(record)}</h2><p>Created {date(record?.createdAt || record?.requestedAt || record?.submittedAt)}</p></div><div className="ws-payout-detail-amount"><span>{record?.currency || "INR"}</span><strong>{money(payoutAmount(record), record?.currency || "INR")}</strong><Badge status={status} /></div></div>
    <details className="ws-payout-accordion" open><summary><SectionSummary number="01" title="Request overview" description="Current status and transfer information" /></summary><div className="ws-payout-accordion-body"><div className="ws-payout-detail-grid"><div><span>Status</span><strong><Badge status={status} /></strong></div><div><span>Method</span><strong>{methodLabel(record)}</strong></div><div><span>Currency</span><strong>{record?.currency || "—"}</strong></div><div><span>Requested amount</span><strong>{money(payoutAmount(record), record?.currency || "INR")}</strong></div><div><span>Created</span><strong>{date(record?.createdAt || record?.requestedAt || record?.submittedAt)}</strong></div><div><span>Updated</span><strong>{date(record?.updatedAt || record?.processedAt)}</strong></div></div></div></details>
    <details className="ws-payout-accordion"><summary><SectionSummary number="02" title="Bank account" description="Destination account supplied with this request" /></summary><div className="ws-payout-accordion-body"><div className="ws-payout-detail-grid">{account.accountHolderName && <div><span>Account holder</span><strong>{account.accountHolderName}</strong></div>}{account.bankName && <div><span>Bank</span><strong>{account.bankName}</strong></div>}{account.accountNumber && <div><span>Account number</span><strong>{account.accountNumber}</strong></div>}{account.routingCode && <div><span>Routing / IFSC</span><strong>{account.routingCode}</strong></div>}{account.country && <div><span>Country</span><strong>{account.country}</strong></div>}</div>{!Object.keys(account).length && <p className="ws-muted">The backend did not return bank account details for this request.</p>}</div></details>
    <details className="ws-payout-accordion" open><summary><SectionSummary number="03" title="Request timeline" description="Progress returned by the payout service" /></summary><div className="ws-payout-accordion-body"><ol className="ws-payout-timeline">{stages.map((stage, index) => <li key={stage} className={index === stages.length - 1 || completed ? "is-current" : ""}><span>{index + 1}</span><div><strong>{stage}</strong><small>{index === 0 ? "Your request was created." : index === stages.length - 1 && failed ? record?.failureReason || "Please review the request details." : index === stages.length - 1 && completed ? "Funds have been marked as transferred." : "The payout team will update this step when processing continues."}</small></div></li>)}</ol>{record?.failureReason && <p className="ws-alert" role="alert">{record.failureReason}</p>}{record?.note && <p className="ws-muted">{record.note}</p>}</div></details>
  </div>;
}

export default function PayoutRequests({ id }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const path = id ? `facilitator/payout-requests/${encodeURIComponent(id)}` : payoutListPath(page);
  const state = useApi(path);
  const records = rowsOf(state.data, ["payoutRequests", "payouts", "requests"]);
  const current = id ? unwrap(state.data) : null;
  const currencies = [...new Set(["ALL", ...records.map(record => record.currency).filter(Boolean)])];
  const visibleRecords = records.filter(record => {
    const haystack = `${payoutLabel(record)} ${record.currency || ""} ${methodLabel(record)} ${payoutStatus(record)}`.toLowerCase();
    return (statusFilter === "ALL" || payoutStatus(record) === statusFilter) && (currencyFilter === "ALL" || record.currency === currencyFilter) && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  async function handleCreated(created) {
    setShowForm(false);
    setNotice("Payout request submitted successfully.");
    if (idOf(created)) {
      router.push(`/dashboard/facilitator/payouts/${encodeURIComponent(idOf(created))}`);
      return;
    }
    await state.reload();
  }

  if (id) return <><div className="ws-toolbar"><Link className="ws-text-link" href="/dashboard/facilitator/payouts">← All payout requests</Link><button className="ws-secondary" disabled={state.loading} onClick={state.reload}>Refresh</button></div><State {...state} retry={state.reload} />{!state.loading && !state.error && current && <PayoutDetail record={current} />}<State empty={!state.loading && !state.error && !current} title="Payout request not found" description="This payout request may no longer be available. Return to the list and try another request." href="/dashboard/facilitator/payouts" action="View payout requests" /></>;

  return <div className="ws-payout-page"><PayoutHero onNew={() => { setShowForm(true); setNotice(""); }} /><PayoutStats records={records} pagination={state.pagination} />{notice && <p className="ws-notice" role="status">{notice}</p>}{showForm && <PayoutForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}
    <section className="ws-payout-list-card"><div className="ws-payout-list-heading"><div><p className="ws-eyebrow">ACTIVITY</p><h2>Your payout requests</h2><p>Track requests submitted through the facilitator payout service.</p></div><button className="ws-secondary" disabled={state.loading} onClick={state.reload}>Refresh</button></div>
      <div className="ws-payout-filters"><label>Search<input className="ws-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search request or method" /></label><label>Status<select className="ws-input" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option>{[...new Set(records.map(record => payoutStatus(record)))].map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label>Currency<select className="ws-input" value={currencyFilter} onChange={event => setCurrencyFilter(event.target.value)}>{currencies.map(currency => <option key={currency} value={currency}>{currency === "ALL" ? "All currencies" : currency}</option>)}</select></label></div>
      <State {...state} retry={state.reload} />
      {!state.loading && !state.error && <>{!visibleRecords.length ? <div className="ws-payout-empty"><span aria-hidden="true">◎</span><h3>{records.length ? "No matching requests" : "No payout requests yet"}</h3><p>{records.length ? "Try another status, currency or search term." : "Create your first bank transfer request when an eligible balance is available."}</p>{records.length ? <button className="ws-secondary" onClick={() => { setStatusFilter("ALL"); setCurrencyFilter("ALL"); setSearch(""); }}>Clear filters</button> : <button className="ws-button" onClick={() => setShowForm(true)}>Create first request</button>}</div> : <div className="ws-payout-request-list">{visibleRecords.map((record, index) => { const recordId = idOf(record); const status = payoutStatus(record); return <article className="ws-payout-request-row" key={recordId || index}><div className="ws-payout-request-mark" aria-hidden="true">₹</div><div className="ws-payout-request-main"><div><p className="ws-payout-request-id">{payoutLabel(record)}</p><h3>{money(payoutAmount(record), record.currency || "INR")}</h3></div><Badge status={status} /><p className="ws-payout-request-meta">{methodLabel(record)} <span>·</span> {record.currency || "INR"} <span>·</span> Requested {date(record.createdAt || record.requestedAt || record.submittedAt)}</p></div>{recordId ? <Link className="ws-payout-view-link" href={`/dashboard/facilitator/payouts/${encodeURIComponent(recordId)}`}>View details <span aria-hidden="true">→</span></Link> : <span className="ws-muted">No ID returned</span>}</article>; })}</div>}{visibleRecords.length > 0 && <Pagination page={page} pagination={state.pagination} count={records.length} onChange={setPage} loading={state.loading} />}</>}
    </section>
  </div>;
}
