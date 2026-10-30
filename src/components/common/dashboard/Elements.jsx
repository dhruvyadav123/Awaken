"use client";
import Link from "next/link";
import { Icon } from "./WorkspaceShell";
export function State({ loading, error, retry, empty, title = "Nothing here yet", description = "Your activity will appear here when it is available.", href, action }) {
  if (loading) return <div role="status" aria-label="Loading data" className="ws-stats"><div className="ws-skeleton" /><div className="ws-skeleton" /></div>;
  if (error) return <div className="ws-alert" role="alert"><span>{error}</span>{retry && <button onClick={retry}>Try again</button>}</div>;
  if (empty) return <div className="ws-empty"><Icon name="leaf" size={32} /><h2>{title}</h2><p>{description}</p>{href && <Link className="ws-secondary" href={href}>{action || "Explore"}<Icon name="arrow" size={15} /></Link>}</div>;
  return null;
}
export function Card({ title, href, children }) { return <section className="ws-card"><div className="ws-card-header"><h2>{title}</h2>{href && <Link className="ws-text-link" href={href}>View all ↗</Link>}</div>{children}</section>; }
export function Badge({ status }) { return status ? <span className="ws-badge" data-status={String(status).toUpperCase()}>{String(status).replaceAll("_", " ")}</span> : <span className="ws-muted">—</span>; }
export function Pagination({ page, pagination, onChange, count, loading }) {
  const pages = pagination?.pages ?? pagination?.totalPages; const more = pages != null ? page < Number(pages) : pagination?.hasNextPage ?? (count === 20);
  if (page === 1 && !more) return null;
  return <nav className="ws-pagination" aria-label="Pagination"><button className="ws-secondary" disabled={page <= 1 || loading} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page}{pages ? ` of ${pages}` : ""}</span><button className="ws-secondary" disabled={!more || loading} onClick={() => onChange(page + 1)}>Next</button></nav>;
}
export function Progress({ value, label = "Course progress" }) { return value === null ? null : <><div className="ws-progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${value}%` }} /></div><small className="ws-muted">{Math.round(value)}% complete</small></>; }
export function RevenueChart({ rows = [], valueKey = "revenue", labelKey = "date", currency = "INR" }) {
  const points = rows.filter(item => Number.isFinite(Number(item[valueKey]))).slice(-12); const max = Math.max(...points.map(item => Number(item[valueKey])), 1);
  if (!points.length) return <State empty title="No chart data yet" description="Your actual sales activity will appear here when the service returns reporting data." />;
  return <svg viewBox="0 0 540 230" role="img" aria-label={`Sales report in ${currency}`} className="ws-chart"><title>Actual sales by reporting period ({currency})</title>{[0, 1, 2, 3].map(i => <g key={i}><line x1="40" x2="530" y1={185 - i * 52} y2={185 - i * 52} stroke="#edf1eb" /><text x="0" y={189 - i * 52}>{Math.round(max * i / 3)}</text></g>)}{points.map((item, index) => { const width = 480 / points.length; const height = Math.max(0, Number(item[valueKey])) / max * 156; const label = String(item[labelKey] ?? item.period ?? ""); return <g key={label + index}><rect x={48 + index * width} y={185 - height} width={Math.min(width - 12, 28)} height={height} rx="4" fill="#40825a"><title>{label}: {item[valueKey]} {currency}</title></rect><text x={45 + index * width} y="213">{label.slice(5, 10) || label}</text></g>; })}</svg>;
}
