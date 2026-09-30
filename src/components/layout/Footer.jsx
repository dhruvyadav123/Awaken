import Image from "next/image";
import Link from "next/link";
import { ContactTrigger } from "../common/ContactPopup";

const explore = [["Start here", "/start-here"], ["Classes", "/classes"], ["Workshops", "/workshops"], ["Facilitators", "/facilitators"], ["Community stories", "/testimonials"], ["Journal", "/blog"], ["Shop", "/shop"]];
const helpful = [["Infinity membership", "/infinity/membership"], ["Our story", "/about"], ["Become a facilitator", "/become-a-facilitator"], ["Contact", "/contact"], ["Privacy policy", "/privacy-policy"], ["Refund policy", "/refund-policy"], ["Terms of use", "/terms"]];

function FooterLinks({ title, links }) {
  return <div className="min-w-0">
    <h2 className="mb-4 mt-1 text-[11px] font-bold tracking-[.08em] text-[#29433a] uppercase">{title}</h2>
    <ul className="m-0 grid list-none gap-3 p-0">
      {links.map(([label, href]) => <li key={href}>
        {href === "/contact"
          ? <ContactTrigger className="text-left text-xs text-[#606e63] hover:text-[#315a48]">{label}</ContactTrigger>
          : <Link className="text-xs text-[#606e63] hover:text-[#315a48]" href={href}>{label}</Link>}
      </li>)}
    </ul>
  </div>;
}

export default function Footer() {
  return <footer className="w-full border-t border-[#e0e5da] bg-[#f3f4ed] px-6 pt-12 pb-5 max-[560px]:px-5">
    <div className="mx-auto grid w-full max-w-[1160px] grid-cols-[minmax(260px,1.5fr)_minmax(130px,1fr)_minmax(160px,1.2fr)_minmax(190px,.9fr)] gap-8 pb-10 max-[850px]:grid-cols-2 max-[850px]:gap-x-6 max-[850px]:gap-y-7 max-[560px]:gap-x-4 max-[560px]:gap-y-7 max-[380px]:grid-cols-1">
      <div className="min-w-0 max-[850px]:col-span-2 max-[560px]:col-span-2 max-[380px]:col-span-1">
        <Link className="inline-flex h-[88px] w-28 items-center" href="/" aria-label="Awaken With Meheck home">
          <Image className="h-[88px] w-[108px] object-contain mix-blend-multiply" src="/images/logo/awaken.png" alt="Awaken with Meheck" width={112} height={96} />
        </Link>
        <p className="mt-3 mb-0 max-w-[330px] text-xs leading-[1.8] text-[#58675c]">Your Guide To You is a self-development company helping people achieve their highest potential by aligning with their true self through Western psychology and Eastern occult knowledge.</p>
      </div>
      <FooterLinks title="Explore" links={explore} />
      <FooterLinks title="Here to help" links={helpful} />
      <div className="min-w-0 border-l border-[#cbd4c8] py-1 pl-5 max-[850px]:border-l-0 max-[850px]:pl-0 max-[560px]:col-span-2 max-[380px]:col-span-1">
        <h2 className="mb-3 text-[11px] font-bold tracking-[.08em] text-[#29433a] uppercase">Visit us</h2>
        <address className="not-italic text-xs leading-[1.8] text-[#5d6a60]">722, Mangal Gyan,<br />12th Road, Khar West,<br />Mumbai 400052</address>
        <a className="mt-4 inline-flex items-center gap-3 text-[11px] font-semibold text-[#315a48] hover:text-[#213e30]" href="https://www.google.com/maps/search/?api=1&query=722%20Mangal%20Gyan%2C%2012th%20Road%2C%20Khar%20West%2C%20Mumbai%20400052" target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">-&gt;</span></a>
      </div>
    </div>
    <div className="mx-auto flex w-full max-w-[1160px] justify-between gap-5 border-t border-[#d9dfd5] pt-4 text-[10px] text-[#718075] max-[560px]:flex-col max-[560px]:gap-2">
      <span>(c) {new Date().getFullYear()} Awaken With Meheck</span>
      <span>Made for your wellbeing</span>
    </div>
  </footer>;
}

