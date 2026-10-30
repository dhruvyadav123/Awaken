import MyMeditations from "@/components/user/learning/MyMeditations";
export const metadata = { title: "Meditation Practice | AwakenWithMeheck" };
export default async function MyMeditationPage({ params }) { const { meditationId } = await params; return <MyMeditations meditationId={meditationId} />; }
