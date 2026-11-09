import { redirect } from 'next/navigation';

/** Keep the legacy route pointing at the real, verified registration flow. */
export default function AgentRegisterPage() {
  redirect('/auth?tab=signup');
}
