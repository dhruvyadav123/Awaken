"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { operationFor } from "@/lib/dashboard/operations";
import { categoryTypes, categoryMutationBody } from "@/lib/dashboard/categories";
import { useApi, rowsOf, idOf, date } from "./data";
import { Badge, Card, Pagination, State } from "./Elements";
import MutationDialog from "./MutationDialog";

const base = "facilitator/categories";
const route = "/dashboard/facilitator/categories";

export default function FacilitatorCategories({ id }) {
  const router = useRouter();
  const query = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(() => ({ created: "Category created. You can now use it in your content.", deleted: "Category deleted." })[query.get("notice")] || "");
  const detailPath = id ? `${base}/${encodeURIComponent(id)}` : undefined;
  const state = useApi(detailPath || `${base}?page=${page}&limit=20`);
  const current = id ? state.data?.category || state.data : null;
  const rows = rowsOf(state.data, ["categories"]);
  const shown = rows.filter((item) => (!type || item.appliesTo?.includes(type)) &&
    `${item.name || ""} ${item.slug || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const versionReady = Number.isSafeInteger(current?.version) && current.version > 0;

  function open(method) {
    const operation = operationFor(method, method === "POST" ? base : `${base}/{{categoryId}}`);
    if (operation) setModal({ operation, path: method === "POST" ? base : detailPath });
  }

  return <>
    <p className="ws-muted">Categories organise your courses, classes, sessions and products. Create a category, then select it when setting up your content.</p>
    <div className="ws-toolbar">
      {id ? <Link href={route} className="ws-text-link">&larr; All categories</Link> : <>
        <input aria-label="Search categories on this page" placeholder="Search this page by name or slug" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filter categories on this page by use" value={type} onChange={(event) => setType(event.target.value)}><option value="">All content types</option>{Object.entries(categoryTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </>}
      <div className="ws-toolbar-actions"><button type="button" className="ws-secondary" disabled={state.loading} onClick={state.reload}>Refresh</button>{!id && <button type="button" className="ws-button" onClick={() => open("POST")}>+ Create category</button>}</div>
    </div>
    {notice && <p role="status" className="ws-notice">{notice}</p>}
    <State {...state} retry={state.reload} />
    {!state.loading && !state.error && !id && <section className="ws-card">
      <State empty={!shown.length} title={rows.length ? "No matching categories on this page" : "No categories yet"} description={rows.length ? "Clear these filters or browse the next page." : "Choose Create category to add your first category."} />
      {shown.length > 0 && <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Category</th><th>Used for</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>
        {shown.map((item) => <tr key={idOf(item)}><td><strong>{item.name}</strong><p className="ws-muted">{item.slug}</p></td><td>{(item.appliesTo || []).map((value) => categoryTypes[value] || value).join(", ") || "No content types"}</td><td><Badge status={item.status} /></td><td>{date(item.updatedAt)}</td><td>{idOf(item) && <Link prefetch={false} className="ws-secondary" href={`${route}/${encodeURIComponent(idOf(item))}`}>View details</Link>}</td></tr>)}
      </tbody></table></div>}
      <Pagination page={page} pagination={state.pagination} count={rows.length} loading={state.loading} onChange={(value) => { setPage(value); setSearch(""); setType(""); }} />
    </section>}
    {!state.loading && !state.error && id && current && <Card title={current.name || "Category details"}>
      <div className="ws-toolbar"><Badge status={current.status} /><div className="ws-toolbar-actions"><button type="button" className="ws-button" disabled={!versionReady || Boolean(current.archivedAt)} onClick={() => open("PATCH")}>Edit category</button><button type="button" className="ws-secondary" disabled={!versionReady || Boolean(current.archivedAt)} onClick={() => open("DELETE")}>Delete category</button></div></div>
      <dl className="ws-review">
        <div><dt>Name</dt><dd>{current.name}</dd></div><div><dt>Slug</dt><dd>{current.slug}</dd></div>
        <div><dt>Description</dt><dd>{current.description || "No description"}</dd></div>
        <div><dt>Used for</dt><dd>{(current.appliesTo || []).map((value) => categoryTypes[value] || value).join(", ")}</dd></div>
        <div><dt>Display order</dt><dd>{current.displayOrder ?? 0}</dd></div>
        <div><dt>Created</dt><dd>{date(current.createdAt)}</dd></div><div><dt>Updated</dt><dd>{date(current.updatedAt)}</dd></div>
        {current.archivedAt && <div><dt>Archived</dt><dd>{date(current.archivedAt)}</dd></div>}
      </dl>
      {!versionReady && <p className="ws-muted">Refresh this category before editing or deleting it.</p>}
      {current.archivedAt && <p className="ws-muted">This category is archived and cannot be changed here.</p>}
    </Card>}
    {!state.loading && !state.error && id && !current && <State empty title="Category unavailable" description="Return to the category list and refresh." href={route} action="All categories" />}
    {modal && <MutationDialog {...modal} detailPath={modal.operation.method !== "POST" ? detailPath : undefined} current={current || {}}
      title={modal.operation.method === "POST" ? "Create category" : modal.operation.method === "DELETE" ? `Delete ${current.name}?` : `Edit ${current.name}`}
      description={modal.operation.method === "DELETE" ? "Confirm that you want to delete this category and enter the reason. The service will check whether it can be removed." : "Enter the category name and a short reason for this change. The slug and other category settings are managed by the service."}
      submitLabel={modal.operation.method === "POST" ? "Create category" : modal.operation.method === "DELETE" ? "Confirm delete" : "Save category"}
      prepareBody={(body, latest) => categoryMutationBody(modal.operation.method, body, current, latest)}
      onClose={() => setModal(null)} onSuccess={async (result) => {
        if (modal.operation.method === "DELETE") { router.push(`${route}?notice=deleted`); return; }
        if (modal.operation.method === "POST") {
          const created = result.data?.category || result.data;
          if (idOf(created)) { router.push(`${route}/${encodeURIComponent(idOf(created))}?notice=created`); return; }
        }
        setNotice(modal.operation.method === "POST" ? "Category created." : "Category updated.");
        await state.reload();
      }} />}
  </>;
}
