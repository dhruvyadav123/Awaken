import { registerUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const user = await registerUser(body);

    return Response.json(
      {
        user,
        message: "Welcome to Awaken With Me! Your account is ready.",
        redirectTo: "/profile",
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || "We could not create your account right now." },
      { status: 400 }
    );
  }
}