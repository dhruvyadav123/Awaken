import MyMeditations from "@/components/learning/MyMeditations";
export const metadata = { title: "Meditation Practice | Awaken With Me" };
export default async function MyMeditationPage({ params }) { const { meditationId } = await params; return <MyMeditations meditationId={meditationId} />; }
