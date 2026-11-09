'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetForm() {
  const token = useSearchParams().get('token') || '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Could not update password.'); return; }
    setMessage(data.message); setTimeout(() => router.push('/auth'), 1000);
  };

  return <main className="flex min-h-screen items-center justify-center bg-paper px-4"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-semibold text-ink">Create a new password</h1><input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-lg border border-[#e3e6ea] px-4 py-3" /><button className="w-full rounded-lg bg-ink px-4 py-3 font-semibold text-white">Update password</button>{error && <p className="text-sm text-red-600">{error}</p>}{message && <p className="text-sm text-emerald-600">{message}</p>}</form></main>;
}

export default function ResetPage() { return <Suspense><ResetForm /></Suspense>; }
