import { redirect } from "next/navigation";

export default async function Home() {
  const sessionId = Date.now().toString();
  redirect(`/workspace/${sessionId}`);
}
