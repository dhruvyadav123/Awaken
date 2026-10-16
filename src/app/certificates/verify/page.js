import { publicApi, readableDate } from "@/lib/public-api";

export const metadata = { title: "Verify a certificate | Awaken With Me", description: "Check an Awaken With Meheck certificate using its verification code." };

export default async function VerifyCertificatePage({ searchParams }) {
  const query = await searchParams;
  const code = typeof query?.code === "string" ? query.code.trim() : "";
  const result = code ? await publicApi("certificates/" + encodeURIComponent(code)) : null;
  const certificate = result?.data && typeof result.data === "object" ? result.data : null;
  const fields = certificate ? [
    ["Recipient", certificate.recipientName || certificate.studentName || certificate.name],
    ["Course or class", certificate.courseTitle || certificate.classTitle || certificate.title],
    ["Issued", readableDate(certificate.issuedAt || certificate.issueDate)],
    ["Status", certificate.status],
    ["Verification code", certificate.verificationCode || code],
  ].filter(([, value]) => typeof value === "string" && value.trim()) : [];

  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8">
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Certificates</p>
      <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-5xl">Verify a certificate.</h1>
      <p className="mt-5 text-base leading-8 text-[#647368]">Enter the verification code printed on a certificate to check its details.</p>
      <form action="/certificates/verify" method="get" className="mt-9 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="verification-code" className="sr-only">Verification code</label>
        <input id="verification-code" name="code" defaultValue={code} required maxLength={120} autoComplete="off" placeholder="Verification code" className="min-h-12 flex-1 rounded-md border border-[#cbd8cb] bg-white px-4 text-[#29473c] outline-[#5574a4]" />
        <button type="submit" className="min-h-12 rounded-md bg-[#315a48] px-6 font-semibold text-white hover:bg-[#254638]">Verify</button>
      </form>
      {code && (result.error || !certificate ? <p role="alert" className="mt-8 rounded-lg border border-[#eadbd4] bg-white p-6 text-[#8a4c3c]">{result.status === 400 || result.status === 404 ? "No certificate was found for this code. Please check it and try again." : result.error || "Certificate details could not be loaded."}</p> : <section className="mt-8 rounded-lg border border-[#dfe7dd] bg-white p-7" aria-label="Certificate verification result">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#66836d]">Certificate found</p>
        <h2 className="mt-3 font-[Georgia,serif] text-2xl">Verification details</h2>
        {fields.length ? <dl className="mt-6 grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wider text-[#738075]">{label}</dt><dd className="mt-1 text-sm text-[#29473c]">{value}</dd></div>)}</dl> : <p className="mt-4 text-sm text-[#647368]">The certificate was found. Additional details are not available.</p>}
      </section>)}
    </div>
  </main>;
}
