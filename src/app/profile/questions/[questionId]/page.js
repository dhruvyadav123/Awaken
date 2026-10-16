import Questions from "@/components/learning/Questions";
export const metadata = { title: "Question Details | Awaken With Me" };
export default async function QuestionPage({ params }) {
  const { questionId } = await params;
  return <Questions questionId={questionId} />;
}
