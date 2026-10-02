import { authenticateUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const user = await authenticateUser(body);

    return Response.json({
      user,
      message: "Signed in successfully.",
      redirectTo: "/profile",
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "We could not sign you in right now." },
      { status: 401 }
    );
  }
}