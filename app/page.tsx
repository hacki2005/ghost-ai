import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/** Routes signed-in visitors to the editor and everyone else to sign-in. */
export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  }

  redirect("/sign-in");
}
