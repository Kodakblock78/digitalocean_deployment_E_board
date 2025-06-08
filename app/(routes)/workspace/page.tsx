import { redirect } from 'next/navigation';

export default async function WorkspacePage() {
  const sessionId = Date.now().toString();
  redirect(`/workspace/${sessionId}`);
}
