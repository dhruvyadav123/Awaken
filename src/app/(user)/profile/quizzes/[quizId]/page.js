
import MyQuizzes from "@/components/user/learning/MyQuizzes";

export const metadata = {
  title: "Quiz Details | AwakenWithMeheck",
};

export default async function QuizDetailPage({
  params,
}) {
  const { quizId } = await params;

  return (
    <MyQuizzes quizId={quizId} />
  );
}
