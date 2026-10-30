
import MyQuizzes from "@/components/user/learning/MyQuizzes";

export const metadata = {
  title: "Quiz Attempt | AwakenWithMeheck",
};

export default async function QuizAttemptPage({
  params,
}) {
  const { attemptId } = await params;

  return (
    <MyQuizzes attemptId={attemptId} />
  );
} 
