"use client";
import Link from "next/link";
import { Icon } from "./WorkspaceShell";
import { useApi, idOf, money, date } from "./data";
import { Card, State } from "./Elements";
import { FACILITATOR_DASHBOARD_PATH, facilitatorOverview, overviewFields } from "@/lib/dashboard/overview";

function FieldValues({ record, financial = false }) {
  const fields = overviewFields(record);
  return <dl className="ws-review">{fields.map(({ key, label, value }) => <div key={key}><dt>{label}</dt><dd>{typeof value === "number" ? financial && record.currency && /amount|revenue|balance|earning|gross|net|paid|payable/i.test(key) && !/count|sales|units/i.test(key) ? money(value, record.currency) : value.toLocaleString("en-IN") : typeof value === "boolean" ? value ? "Yes" : "No" : /At$/.test(key) && Number.isFinite(Date.parse(value)) ? date(value) : String(value)}</dd></div>)}</dl>;
}
function RecentRecords({ records, questions = false }) {
  return <ul className="ws-list">{records.filter(item => item && typeof item === "object").map((record, index) => <li key={idOf(record) || index}><div className="ws-list-content">{!questions && record.currency && <h3>{record.currency}</h3>}<FieldValues record={record} financial={!questions} />{record.courseId && typeof record.courseId === "string" && <Link className="ws-text-link" href={`/dashboard/facilitator/courses/${encodeURIComponent(record.courseId)}`}>{questions ? "Open course questions" : "View course"} ↗</Link>}</div></li>)}</ul>;
}
export default function FacilitatorOverview() {
  const state = useApi(FACILITATOR_DASHBOARD_PATH);
  const data = facilitatorOverview(state.data);
  return <>
    <nav aria-label="Facilitator quick actions" className="ws-toolbar-actions" style={{ marginBottom: 20 }}><Link className="ws-button" href="/dashboard/facilitator/courses?create=true">Create a course <Icon name="arrow" size={16} /></Link><Link className="ws-secondary" href="/dashboard/facilitator/categories">Manage categories</Link><Link className="ws-secondary" href="/dashboard/facilitator/profile">View my profile</Link><Link className="ws-secondary" href="/dashboard/facilitator/workshops">Classes & workshops</Link><Link className="ws-secondary" href="/dashboard/facilitator/bookings">Session bookings</Link></nav>
    <div className="ws-toolbar"><span className="ws-muted">{data.asOf ? `Updated ${date(data.asOf)}` : "Your teaching activity at a glance"}</span><button className="ws-secondary" disabled={state.loading} onClick={state.reload}>{state.loading ? "Refreshing…" : "Refresh"}</button></div>
    <State {...state} retry={state.reload} />
    <State empty={!state.loading && !state.error && !state.data} title="Dashboard data unavailable" description="Refresh to request your latest teaching activity." />
    {!state.loading && !state.error && state.data && <><div className="ws-stats">{data.metrics.map(([label, value, icon]) => <article className="ws-stat" key={label}><span className="ws-stat-icon"><Icon name={icon} /></span><div><small>{label}</small><strong>{value == null ? "—" : value.toLocaleString("en-IN")}</strong></div></article>)}</div>
      <Card title="Finances by currency" href="/dashboard/facilitator/earnings"><State empty={!data.finances.length} title="No financial activity yet" description="Your balances and earnings will appear here when available." /><div className="ws-grid">{data.finances.filter(item => item && typeof item === "object").map((record, index) => <section key={record.currency || idOf(record) || index}><h3>{record.currency || "Financial activity"}</h3><FieldValues record={record} financial /></section>)}</div></Card>
      <div className="ws-grid"><Card title="Recent sales" href="/dashboard/facilitator/earnings"><State empty={!data.sales.length} title="No recent sales" description="Your latest sales will appear here." /><RecentRecords records={data.sales} /></Card><Card title="Recent questions"><State empty={!data.questions.length} title="No recent questions" description="Questions from your students will appear here." /><RecentRecords records={data.questions} questions /></Card></div>
    </>}
  </>;
}
