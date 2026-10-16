import MyQuizzes from "@/components/learning/MyQuizzes";
export const metadata = { title: "Quiz | Awaken With Me" };
export default async function QuizPage({ params }) { const { quizId } = await params; return <MyQuizzes quizId={quizId} />; }
