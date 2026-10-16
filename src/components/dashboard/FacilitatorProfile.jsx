"use client";

import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useState } from "react";
import { useApi, date } from "./data";
import { Card, State, Badge } from "./Elements";
import MutationDialog from "./MutationDialog";
import { operationFor } from "@/lib/dashboard/operations";

const labels = { shortBio: "Short biography", fullBio: "Full biography", experience: "Teaching experience", education: "Education", specializations: "Specializations", languages: "Languages", certifications: "Certifications", country: "Country", state: "State", city: "City" };

export default function FacilitatorProfile() {
  const state = useApi("facilitator/profile");
  const profile = state.data?.profile || state.data;
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const operation = operationFor("PATCH", "facilitator/profile");
  return <>
    <div className="ws-toolbar"><p className="ws-muted">Your facilitator identity, teaching background and public profile.</p><button type="button" className="ws-secondary" disabled={state.loading} onClick={state.reload}>Refresh profile</button></div>
    <State {...state} retry={state.reload} />
    {notice && <p role="status" className="ws-notice">{notice}</p>}
    {!state.loading && !state.error && !profile && <State empty title="Profile unavailable" description="Refresh to request your facilitator profile." />}
    {!state.loading && !state.error && profile && <Card title={profile.displayName || "Your facilitator profile"}><RecordMedia record={profile} scope="facilitator" /><RecordDetails record={profile} />
      <div className="ws-toolbar"><div className="ws-toolbar-actions"><Badge status={profile.status} /><Badge status={profile.isVerified ? "Verified" : "Not verified"} />{profile.isFeatured && <Badge status="Featured" />}</div>
        <div className="ws-toolbar-actions">{profile.slug && profile.status === "ACTIVE" && <Link prefetch={false} className="ws-secondary" href={`/facilitators/${encodeURIComponent(profile.slug)}`}>View public profile</Link>}{operation && <button type="button" className="ws-button" disabled={!Number.isSafeInteger(profile.version)} onClick={() => setEditing(true)}>Edit display name</button>}</div>
      </div>
      <dl className="ws-review"><div><dt>Display name</dt><dd>{profile.displayName}</dd></div><div><dt>Public profile slug</dt><dd>{profile.slug || "Not assigned"}</dd></div>
        {Object.entries(labels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{Array.isArray(profile[key]) ? profile[key].map((item) => typeof item === "string" ? item : item.name || item.title || "Certification").join(", ") || "Not provided" : profile[key] || "Not provided"}</dd></div>)}
        <div><dt>Updated</dt><dd>{date(profile.updatedAt)}</dd></div>
      </dl>
      {profile.website && /^https?:\/\//i.test(profile.website) && <p><a className="ws-text-link" href={profile.website} target="_blank" rel="noopener noreferrer">Visit website</a></p>}
    </Card>}
    {editing && operation && <MutationDialog operation={operation} path="facilitator/profile" detailPath="facilitator/profile" current={profile} title="Edit display name" description="Update the name shown on your facilitator profile." submitLabel="Save display name" onClose={() => setEditing(false)} onSuccess={async () => { setNotice("Your display name has been updated."); await state.reload(); }} />}
  </>;
}
