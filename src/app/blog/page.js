import ContentPage from "../../components/common/ContentPage";

export const metadata = { title: "Journal | Awaken With Me" };

export default function JournalPage() {
	return (
		<ContentPage
			heroImage={{
				src: "/images/pages/journal-hero.png",
				alt: "An open journal and tea on a sunlit wooden table",
			}}
			eyebrow="Journal"
			title="A few thoughtful places to begin."
			description="Short reflections for noticing, pausing, and making room in an ordinary day."
			primaryAction={{ label: "Start a practice", href: "/meditations" }}
			cards={[
				{
					tag: "NOTICE",
					title: "The quiet art of noticing",
					body: "A gentle invitation to pause, look again, and find a little more room in the middle of an ordinary day.",
					image: {
						src: "/images/home/blog.jpeg",
						alt: "A quiet, reflective scene for a moment of mindful reading",
					},
					href: "/blog/quiet-art-of-noticing",
					label: "Read the reflection",
				},
				{
					tag: "CONNECTION",
					title: "The practice of being together",
					body: "Shared moments can make room for listening, reflection, and a sense of belonging.",
					image: {
						src: "/images/home/home1.jpeg",
						alt: "A group gathered together for a shared practice",
					},
					href: "/blog/practising-together",
					label: "Read the reflection",
				},
			]}
			sections={[
				{
					heading: "Read at your own pace",
					body: "Take what is useful, leave what is not, and give each reflection the time it needs.",
				},
			]}
		/>
	);
}

