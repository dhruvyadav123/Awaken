import MyQuizzes from "@/components/learning/MyQuizzes";
export const metadata = { title: "Quiz Attempt | Awaken With Me" };
export default async function QuizAttemptPage({ params }) { const { attemptId } = await params; return <MyQuizzes attemptId={attemptId} />; }
