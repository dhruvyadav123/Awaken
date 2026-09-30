import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Training and Classes | Awaken With Me" };

const practiceAreas = [
	{ name: "Mindful movement", label: "Move with awareness", description: "Bring attention to posture, movement, and how your body feels. Work within a comfortable range and pause whenever you need." },
	{ name: "Breath awareness", label: "Notice, don't force", description: "Use the natural rhythm of your breathing as one possible point of attention. There is no need to deepen, hold, or control the breath." },
	{ name: "Meditation", label: "Return to the present", description: "Practise noticing sounds, sensations, or thoughts without needing to clear your mind or get it exactly right." },
	{ name: "Reflection", label: "Make space to understand", description: "Use a prompt or a few written notes to notice what is on your mind and choose one small next step." },
];

const startingSteps = [
	["Notice what you need", "A moment of quiet, gentle movement, or a chance to reflect can each be a different place to begin."],
	["Choose a comfortable format", "Think about whether you prefer to practise independently or with a group, and how much time you can set aside."],
	["Check the details first", "Before booking, look for the facilitator, format, duration, accessibility information, cost, and cancellation terms."],
];

const questions = [
	["Do I need experience?", "There are no active class listings with entry requirements yet. When a class is published, check its description for experience level and preparation."],
	["Are classes available to book now?", "No. The public catalogue does not currently list dates, facilitators, prices, or enrollment details, so there are no classes to book through this page."],
	["Is this a substitute for professional care?", "No. General wellbeing practices are not medical or mental health treatment. If you need care or support, contact a qualified professional."],
];

export default function ClassesPage() {
	return <div className="w-full text-[#243b52] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-[3px] [&_a:focus-visible]:outline-[#5574a4]">
		<section className="overflow-hidden bg-[#f1f3ee]" aria-labelledby="classes-title">
			<div className="mx-auto grid min-h-[550px] w-[min(100%-48px,1160px)] grid-cols-[minmax(0,1.05fr)_minmax(300px,.85fr)] items-center gap-16 py-12 max-[940px]:gap-9 max-[680px]:min-h-0 max-[680px]:w-[min(100%-36px,520px)] max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-6 max-[680px]:py-10 max-[680px]:pb-7 max-[380px]:w-[min(100%-28px,520px)]">
				<div className="max-w-[610px]">
					<p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">AWAKEN WITH MEHECK <span> / </span> CLASSES &amp; LEARNING</p>
					<h1 id="classes-title" className="max-w-[600px] text-balance font-[Georgia,serif] text-[58px] leading-[1.08] font-normal text-[#29473c] max-[940px]:text-[49px] max-[680px]:max-w-[500px] max-[680px]:text-[43px] max-[380px]:text-[38px]">A practice that fits your everyday.</h1>
					<p className="mt-5 max-w-[540px] text-[15px] leading-[1.85] text-[#5d6c62] max-[680px]:mt-[15px] max-[680px]:text-[13px]">Explore mindful approaches through movement, breath awareness, meditation, and reflection. Start with the kind of space you need, not a perfect plan.</p>
					<div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-[14px] max-[680px]:mt-5">
						<Link className="inline-flex min-h-[46px] items-center justify-center gap-[22px] rounded border border-[#315a48] bg-[#315a48] px-[17px] text-xs font-semibold text-white hover:bg-[#254638]" href="/meditations">Try a written practice <span aria-hidden="true">-&gt;</span></Link>
						<Link className="border-b border-[#aeb8ab] py-[10px] text-xs font-semibold text-[#315a48]" href="/contact">Ask about classes</Link>
					</div>
					<p className="mt-[23px] font-[Georgia,serif] text-[13px] italic text-[#7c897e]">At your pace. In your own way.</p>
				</div>
				<figure className="relative m-0 aspect-[4/4.7] min-w-0 overflow-hidden rounded-[5px] bg-[#e5e9e0] max-[680px]:aspect-[1/1.05] max-[680px]:w-[min(100%,390px)] max-[680px]:justify-self-center [&_img]:object-contain [&_img]:object-bottom [&_img]:mix-blend-multiply [&_figcaption]:absolute [&_figcaption]:right-[14px] [&_figcaption]:bottom-[14px] [&_figcaption]:bg-white/90 [&_figcaption]:px-[10px] [&_figcaption]:py-2 [&_figcaption]:text-[10px] [&_figcaption]:font-semibold [&_figcaption]:text-[#375241]">
					<Image src="/images/hero/meheck.png" alt="Meheck in a yellow and blue sari" fill priority sizes="(max-width: 760px) 100vw, 42vw" />
					<figcaption>Awaken With Meheck</figcaption>
				</figure>
			</div>
		</section>

		<div className="mx-auto w-[min(100%-48px,1120px)] max-[680px]:w-[min(100%-36px,520px)] max-[380px]:w-[min(100%-28px,520px)]">
			<section className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-[14px] border-b border-[#e5e9e8] py-5 max-[680px]:grid-cols-[10px_minmax(0,1fr)] max-[680px]:gap-[11px] [&_strong]:block [&_strong]:text-xs [&_strong]:text-[#293f36] [&_p]:mt-1 [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:text-[#6d7980] [&>a]:whitespace-nowrap [&>a]:text-[11px] [&>a]:font-semibold [&>a]:text-[#315a48] max-[680px]:[&>a]:col-start-2 max-[680px]:[&>a]:justify-self-start max-[680px]:[&>a]:pt-[3px]" aria-label="Class availability">
				<span className="h-2 w-2 rounded-full bg-[#bd794d]" aria-hidden="true" />
				<div><strong>Class catalogue</strong><p>No bookable classes are currently listed. Dates, facilitators, and fees have not been published.</p></div>
				<Link href="/contact">Ask a question <span aria-hidden="true">-&gt;</span></Link>
			</section>

			<section className="border-b border-[#e5e9e8] py-[72px] max-[680px]:py-12" aria-labelledby="practice-areas-title">
				<div className="mb-7 grid grid-cols-[minmax(0,1fr)_minmax(230px,.72fr)] items-end gap-[38px] max-[680px]:mb-[22px] max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-[22px] [&_h2]:max-w-[540px] [&_h2]:text-balance [&_h2]:font-[Georgia,serif] [&_h2]:text-4xl [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:text-[#29473c] max-[680px]:[&_h2]:text-[31px] [&>p]:text-[13px] [&>p]:leading-[1.8] [&>p]:text-[#65736a]">
					<div><p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">PRACTICE AREAS</p><h2 id="practice-areas-title">Different ways to make a little room.</h2></div>
					<p>These are the kinds of practice highlighted across Awaken With Meheck. They describe areas of interest, not scheduled or bookable classes.</p>
				</div>
				<div className="grid grid-cols-4 gap-3 max-[940px]:grid-cols-2 max-[680px]:gap-[9px] max-[380px]:grid-cols-1">
					{practiceAreas.map((area, index) => <article className={`min-h-[232px] min-w-0 rounded-[5px] border border-[#e1e6e3] border-t-[3px] bg-white px-[18px] py-5 transition-[transform,box-shadow] duration-180 ease-out hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgb(43_69_53/8%)] motion-reduce:transition-none max-[680px]:min-h-[215px] max-[680px]:px-[14px] max-[680px]:py-4 max-[380px]:min-h-0 ${["border-t-[#60806c]","border-t-[#55749b]","border-t-[#a87c73]","border-t-[#a38d5e]"][index]}`} key={area.name}>
						<div className="flex min-h-[27px] items-start justify-between gap-2 text-[9px] leading-[1.5] text-[#7b8790] max-[380px]:min-h-[22px] [&>span:first-child]:font-bold [&>span:first-child]:text-[#41654e] [&>span:last-child]:text-right"><span>0{index + 1}</span><span>{area.label}</span></div>
						<h3 className="mt-[21px] mb-[9px] font-[Georgia,serif] text-[22px] leading-[1.25] font-normal text-[#29473c] max-[680px]:mt-4 max-[680px]:text-xl">{area.name}</h3>
						<p className="text-[11px] leading-[1.75] text-[#68756c]">{area.description}</p>
					</article>)}
				</div>
			</section>

			<section className="grid grid-cols-[minmax(220px,.8fr)_minmax(0,1.2fr)] gap-[70px] border-b border-[#e5e9e8] py-[72px] max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-[22px] max-[680px]:py-12 [&_h2]:max-w-[540px] [&_h2]:text-balance [&_h2]:font-[Georgia,serif] [&_h2]:text-4xl [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:text-[#29473c] max-[680px]:[&_h2]:text-[31px]" aria-labelledby="classes-start-title">
				<div className="[&>p:last-child]:mt-[14px] [&>p:last-child]:max-w-[390px] [&>p:last-child]:text-[13px] [&>p:last-child]:leading-[1.8] [&>p:last-child]:text-[#65736a]"><p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">A SIMPLE WAY TO BEGIN</p><h2 id="classes-start-title">Let your next step be small.</h2><p>You do not need to know where a whole journey leads. Begin with what feels manageable today.</p></div>
				<ol className="m-0 list-none p-0 [&_li]:grid [&_li]:grid-cols-[35px_minmax(0,1fr)] [&_li]:gap-[14px] [&_li]:border-b [&_li]:border-[#e5e9e8] [&_li]:py-[15px] [&_li:first-child]:pt-0 [&_li:last-child]:border-b-0 [&_li>span]:pt-[2px] [&_li>span]:text-[10px] [&_li>span]:font-bold [&_li>span]:text-[#65816d] [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-[#29473c] [&_p]:mt-[6px] [&_p]:text-[11px] [&_p]:leading-[1.7] [&_p]:text-[#68756c]">
					{startingSteps.map(([title, description], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}
				</ol>
			</section>

			<section className="grid grid-cols-[minmax(220px,.8fr)_minmax(0,1.2fr)] gap-[70px] border-b border-[#e5e9e8] py-[72px] max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-[22px] max-[680px]:py-12 [&_h2]:max-w-[540px] [&_h2]:text-balance [&_h2]:font-[Georgia,serif] [&_h2]:text-4xl [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:text-[#29473c] max-[680px]:[&_h2]:text-[31px] [&>div>p:last-child]:mt-[14px] [&>div>p:last-child]:max-w-[390px] [&>div>p:last-child]:text-[13px] [&>div>p:last-child]:leading-[1.8] [&>div>p:last-child]:text-[#65736a] [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 [&_li]:grid [&_li]:grid-cols-[minmax(120px,.7fr)_minmax(0,1fr)] [&_li]:gap-4 [&_li]:border-b [&_li]:border-[#e5e9e8] [&_li]:py-[13px] [&_li:first-child]:pt-0 max-[680px]:[&_li]:grid-cols-[minmax(105px,.7fr)_minmax(0,1fr)] max-[680px]:[&_li]:gap-3 [&_li_strong]:text-[11px] [&_li_strong]:text-[#314c3c] [&_li_span]:text-[11px] [&_li_span]:leading-[1.6] [&_li_span]:text-[#68756c]" aria-labelledby="class-details-title">
				<div><p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">BEFORE YOU BOOK</p><h2 id="class-details-title">Know what you are joining.</h2><p>A useful class listing should give you enough detail to decide whether it works for you.</p></div>
				<ul>
					<li><strong>Who leads it</strong><span>Facilitator and relevant experience</span></li>
					<li><strong>How it works</strong><span>Format, duration, and what to expect</span></li>
					<li><strong>What it costs</strong><span>Price and cancellation terms</span></li>
					<li><strong>What you may need</strong><span>Preparation and accessibility details</span></li>
				</ul>
			</section>

			<section className="grid grid-cols-[minmax(220px,.8fr)_minmax(0,1.2fr)] gap-[70px] border-b border-[#e5e9e8] py-[72px] max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-[22px] max-[680px]:py-12 [&_h2]:max-w-[540px] [&_h2]:text-balance [&_h2]:font-[Georgia,serif] [&_h2]:text-4xl [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:text-[#29473c] max-[680px]:[&_h2]:text-[31px]" aria-labelledby="classes-faq-title">
				<div><p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">GOOD TO KNOW</p><h2 id="classes-faq-title">A few helpful answers.</h2></div>
				<div className="[&_details]:border-b [&_details]:border-[#e5e9e8] [&_details:first-child]:border-t [&_summary]:flex [&_summary]:min-h-[52px] [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:justify-between [&_summary]:gap-[15px] [&_summary]:text-xs [&_summary]:font-semibold [&_summary]:text-[#314c3c] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-[3px] [&_summary:focus-visible]:outline-[#5574a4] [&_details_p]:mt-[-2px] [&_details_p]:mr-7 [&_details_p]:mb-4 [&_details_p]:max-w-[620px] [&_details_p]:text-[11px] [&_details_p]:leading-[1.8] [&_details_p]:text-[#68756c]">{questions.map(([question, answer]) => <details className="group" key={question}><summary>{question}<span className="text-lg font-normal text-[#55745e] group-open:hidden">+</span><span className="hidden text-lg font-normal text-[#55745e] group-open:inline">−</span></summary><p>{answer}</p></details>)}</div>
			</section>

			<section className="my-[55px] mb-[72px] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 rounded-[5px] bg-[#29473c] p-8 text-white max-[680px]:my-[38px] max-[680px]:mb-12 max-[680px]:grid-cols-[minmax(0,1fr)] max-[680px]:gap-5 max-[680px]:px-5 max-[680px]:py-[23px] [&_.classes-eyebrow]:text-[#c2d1c2] [&_h2]:max-w-[540px] [&_h2]:text-balance [&_h2]:font-[Georgia,serif] [&_h2]:text-[30px] [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:text-white [&>div>p:last-child]:mt-[14px] [&>div>p:last-child]:max-w-[390px] [&>div>p:last-child]:text-[13px] [&>div>p:last-child]:leading-[1.8] [&>div>p:last-child]:text-[#d5ded5]" aria-labelledby="classes-next-title">
				<div><p className="mb-[15px] text-[10px] leading-[1.7] font-bold tracking-[1.6px] text-[#54735f] [&_span]:px-[5px] [&_span]:text-[#a0a89a]">START WHERE YOU ARE</p><h2 id="classes-next-title">Want to try something now?</h2><p>A written meditation and a short journal reflection are already available to explore at your own pace.</p></div>
				<div className="grid min-w-[215px] max-[680px]:min-w-0 [&_a]:flex [&_a]:min-h-[42px] [&_a]:items-center [&_a]:justify-between [&_a]:gap-[14px] [&_a]:border-b [&_a]:border-white/28 [&_a]:text-[11px] [&_a]:text-white [&_a:hover]:text-[#d4e2cb]"><Link href="/meditations">Explore meditations <span aria-hidden="true">-&gt;</span></Link><Link href="/blog">Read a journal reflection <span aria-hidden="true">-&gt;</span></Link></div>
			</section>
		</div>
	</div>;
}
