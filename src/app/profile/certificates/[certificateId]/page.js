"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { accountFetch } from "@/lib/client-account";

export default function CertificateDetailPage() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    accountFetch(`me/certificates/${encodeURIComponent(certificateId)}`).then((result) => { if (active) setCertificate(result.data); }).catch((caught) => { if (active) setError(caught.message); });
    return () => { active = false; };
  }, [certificateId]);
  return <main className="min-h-[60vh] bg-[#f7f8f3] px-5 py-14 text-[#29473c]"><article className="mx-auto max-w-3xl rounded-xl border border-[#dfe7dd] bg-white p-8"><Link className="text-sm font-semibold text-[#315a48] underline" href="/profile/certificates">← My certificates</Link>{error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{error}</p> : !certificate ? <p className="mt-8">Loading certificate…</p> : <><p className="mt-8 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Certificate</p><h1 className="mt-3 font-[Georgia,serif] text-4xl">{certificate.title || certificate.courseTitle || certificate.classTitle || "Certificate"}</h1><dl className="mt-7 grid gap-5 sm:grid-cols-2">{[["Recipient", certificate.recipientName || certificate.studentName], ["Issued", certificate.issuedAt || certificate.issueDate ? new Date(certificate.issuedAt || certificate.issueDate).toLocaleDateString("en-IN") : ""], ["Verification code", certificate.verificationCode || certificate.code], ["Status", certificate.status]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wider text-[#738075]">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl><a className="mt-8 inline-flex rounded bg-[#315a48] px-5 py-3 text-sm font-semibold text-white" href={`/api/account/me/certificates/${encodeURIComponent(certificateId)}/download`}>Download certificate</a></>}</article></main>;
}
