"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi, rowsOf, idOf, money, date } from "./data";
import { State, Card, Badge, Pagination } from "./Elements";
import { earningsPaths } from "@/lib/dashboard/earnings";
import { overviewFields } from "@/lib/dashboard/overview";

function Values({ record, currency, title = "No summary values available" }) {
  const fields = overviewFields(record);
  return <><State empty={!fields.length} title={title} description="Returned account values will appear here." /><dl className="ws-review">{fields.map(({ key, label, value }) => <div key={key}><dt>{label}</dt><dd>{typeof value === "number" ? /amount|earning|revenue|balance|gross|net|paid|payable/i.test(key) && !/count|units/i.test(key) ? money(value, record.currency || currency) : value.toLocaleString("en-IN") : /At$/.test(key) && Number.isFinite(Date.parse(value)) ? date(value) : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl></>;
}
export default function Earnings({ id }) {
  const params = useSearchParams();
  const initial = /^[A-Z]{3}$/.test(params.get("currency") || "") ? params.get("currency") : "INR";
  const [currency, setCurrency] = useState(initial); const [input, setInput] = useState(initial); const [page, setPage] = useState(1); const [error, setError] = useState("");
  const paths = earningsPaths(currency, page, id);
  const state = useApi(id ? paths.detail : paths.list); const summary = useApi(id ? null : paths.summary);
  const records = rowsOf(state.data, ["earnings"]); const detail = state.data?.earning || state.data; const totals = summary.data?.summary || summary.data;
  function apply(event) { event.preventDefault(); try { const next = earningsPaths(input); setCurrency(next.currency); setInput(next.currency); setPage(1); setError(""); } catch (caught) { setError(caught.message); } }
  return <>{id ? <div className="ws-toolbar"><Link className="ws-text-link" href={`/dashboard/facilitator/earnings?currency=${currency}`}>← All earnings</Link><button className="ws-secondary" disabled={state.loading} onClick={state.reload}>Refresh</button></div> : <form className="ws-toolbar" onSubmit={apply}><label className="ws-field">Currency<input className="ws-input" aria-label="Earnings currency" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={input} onChange={event => setInput(event.target.value.toUpperCase())} /></label><button className="ws-button" type="submit">Apply currency</button><button className="ws-secondary" type="button" disabled={state.loading || summary.loading} onClick={() => Promise.all([state.reload(), summary.reload()])}>Refresh</button></form>}
    {error && <p role="alert" className="ws-alert">{error}</p>}
    {!id && <Card title={`Earnings summary · ${currency}`}><State {...summary} retry={summary.reload} />{!summary.loading && !summary.error && totals && <Values record={totals} currency={currency} />}<State empty={!summary.loading && !summary.error && !totals} title="No earnings summary yet" description="Your earnings summary will appear here when available." /></Card>}
    <State {...state} retry={state.reload} />
    <State empty={Boolean(id) && !state.loading && !state.error && !detail} title="Earning not available" description="No earning details were returned. Try refreshing the record." />
    {!state.loading && !state.error && (id ? detail && <Card title="Earning details"><Values record={detail} currency={currency} title="No earning details available" /></Card> : <Card title={`Earnings · ${currency}`}><State empty={!records.length} title="No earnings yet" description="Your earnings in this currency will appear here after eligible sales and bookings." />{!!records.length && <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Earning</th><th>Status</th><th>Amount</th><th>Created</th><th /></tr></thead><tbody>{records.map((record, index) => { const key = idOf(record); return <tr key={key || index}><td>{record.title || record.description || record.type || key || "—"}</td><td><Badge status={record.status} /></td><td>{money(record.amount ?? record.netAmount, record.currency || currency)}</td><td>{date(record.createdAt)}</td><td>{key && <Link className="ws-secondary" href={`/dashboard/facilitator/earnings/${encodeURIComponent(key)}?currency=${currency}`}>View details</Link>}</td></tr>; })}</tbody></table></div>}<Pagination page={page} pagination={state.pagination} count={records.length} onChange={setPage} loading={state.loading} /></Card>)}
  </>;
}
