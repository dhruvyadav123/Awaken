
import Questions from "@/components/user/learning/Questions";

export const metadata = {
  title: "Question Details | AwakenWithMeheck",
};

export default async function QuestionDetailPage({
  params,
}) {
  const { questionId } = await params;

  return (
    <Questions questionId={questionId} />
  );
}
