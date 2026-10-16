"use client";
import { useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { requiredVersion } from "@/lib/student-flow";
import { useApi, rowsOf } from "@/components/dashboard/data";
import { Pagination } from "@/components/dashboard/Elements";

const fields = [["label", "Address label"], ["fullName", "Full name"], ["phone", "Phone"], ["addressLine1", "Address line 1"], ["addressLine2", "Address line 2"], ["landmark", "Landmark"], ["city", "City"], ["state", "State"], ["country", "Country code"], ["postalCode", "Postal code"]];
const blank = () => ({ ...Object.fromEntries(fields.map(([key]) => [key, ""])), country: "IN", isDefault: false });
const button = "rounded-md border border-[#315a48] px-4 py-2 text-sm font-semibold text-[#315a48] disabled:opacity-50";
export default function AddressBook({ onChange }) {
  const [page, setPage] = useState(1);
  const state = useApi(`me/addresses?page=${page}&limit=20`);
  const addresses = rowsOf(state.data, ["addresses"]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  async function act(run) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try { await run(); await state.reload(); await onChange?.(); }
    catch (caught) { setError(caught.message + (caught.status === 409 ? " Refresh addresses and reopen the address before retrying." : "")); }
    finally { lock.current = false; setBusy(false); }
  }
  async function edit(address) {
    await act(async () => {
      const current = (await accountFetch(`me/addresses/${encodeURIComponent(address.id)}`)).data;
      requiredVersion(current?.version, "address");
      setEditing(current); setForm({ ...blank(), ...Object.fromEntries(fields.map(([key]) => [key, current[key] || ""])), isDefault: Boolean(current.isDefault) });
    });
  }
  async function save(event) {
    event.preventDefault();
    await act(async () => {
      const payload = Object.fromEntries(fields.map(([key]) => [key, form[key].trim()]));
      payload.country = payload.country.toUpperCase(); payload.isDefault = form.isDefault;
      if (!/^[A-Z]{2}$/.test(payload.country)) throw new Error("Use a two-letter country code, such as IN.");
      if (fields.some(([key]) => !["addressLine2", "landmark"].includes(key) && !payload[key])) throw new Error("Complete all required address fields.");
      const result = await accountFetch(editing ? `me/addresses/${encodeURIComponent(editing.id)}` : "me/addresses", { method: editing ? "PATCH" : "POST", body: { ...payload, ...(editing ? { version: requiredVersion(editing.version, "address") } : {}) } });
      setNotice(result.message || "Address saved."); setEditing(null); setForm(blank());
    });
  }
  function mutate(address, action) {
    if (action === "delete" && !window.confirm(`Delete the ${address.label || "saved"} address?`)) return;
    return act(async () => {
      const current = (await accountFetch(`me/addresses/${encodeURIComponent(address.id)}`)).data;
      const result = await accountFetch(`me/addresses/${encodeURIComponent(address.id)}${action === "default" ? "/default" : ""}`, { method: action === "default" ? "PATCH" : "DELETE", body: { version: requiredVersion(current?.version, "address") } });
      if (editing?.id === address.id) { setEditing(null); setForm(blank()); }
      setNotice(result.message || (action === "default" ? "Default address updated." : "Address deleted."));
    });
  }
  return <section className="mt-8" aria-label="Saved addresses"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-[Georgia,serif] text-2xl">Saved addresses</h2><button className={button} disabled={state.loading || busy} onClick={state.reload}>Refresh addresses</button></div>
    {state.loading && <p role="status" className="mt-4">Loading addresses…</p>}{(state.error || error) && <p role="alert" className="mt-4 rounded bg-[#fff4f0] p-4">{error || state.error}</p>}{notice && <p role="status" className="mt-4 text-[#315a48]">{notice}</p>}
    {!state.loading && !state.error && (addresses.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{addresses.map(address => <article key={address.id} className="rounded-xl border border-[#dfe7dd] bg-white p-5"><h3 className="font-semibold">{address.label}{address.isDefault && " · Default"}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6">{[address.fullName, address.addressLine1, address.addressLine2, address.landmark, `${address.city}, ${address.state} ${address.postalCode}`, address.country, address.phone].filter(Boolean).join("\n")}</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => edit(address)}>Edit</button><button disabled={busy || address.isDefault} className={button} onClick={() => mutate(address, "default")}>Set default</button><button disabled={busy} className={button} onClick={() => mutate(address, "delete")}>Delete</button></div></article>)}</div> : <p className="mt-4">No saved addresses yet. Add one below.</p>)}
    <Pagination page={page} pagination={state.pagination} count={addresses.length} loading={state.loading || busy} onChange={setPage} />
    <form onSubmit={save} className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><h3 className="font-[Georgia,serif] text-xl">{editing ? "Edit address" : "Add an address"}</h3><fieldset disabled={busy} className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="grid gap-2 text-sm">{label}<input required={!["addressLine2", "landmark"].includes(key)} type={key === "phone" ? "tel" : "text"} maxLength={key === "country" ? 2 : 200} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} className="min-w-0 rounded border border-[#cbd8cb] px-3 py-2" /></label>)}<label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isDefault} onChange={event => setForm({ ...form, isDefault: event.target.checked })} />Set as default address</label></fieldset><div className="mt-5 flex gap-3"><button disabled={busy} className={button}>{busy ? "Saving…" : editing ? "Save changes" : "Add address"}</button>{editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm(blank()); }} className={button}>Cancel editing</button>}</div></form>
  </section>;
}
