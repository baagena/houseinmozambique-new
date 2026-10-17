'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';

type Profile = { name: string; email: string; role: string };

const inputClass = 'w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10 disabled:bg-[#f7f9fb]';

export default function AccountProfileForm() {
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', role: '' });
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load your profile.');
        const next = { name: data.user.name, email: data.user.email, role: data.user.role } as Profile;
        setProfile(next);
        setInitialProfile(next);
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    const credentialsChanged = Boolean(initialProfile && profile.email.trim().toLowerCase() !== initialProfile.email.toLowerCase()) || Boolean(newPassword);
    if (credentialsChanged && !currentPassword) {
      setError('Enter your current password to change your email or password.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();
      if (data.user) {
        const returned = { name: data.user.name, email: data.user.email, role: data.user.role } as Profile;
        setProfile(returned);
        setInitialProfile(returned);
        window.dispatchEvent(new Event('account-profile-updated'));
        if (!response.ok) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }
      if (!response.ok) throw new Error(data.error || 'Could not update your profile.');
      const saved = { name: data.user.name, email: data.user.email, role: data.user.role } as Profile;
      setProfile(saved);
      setInitialProfile(saved);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(data.message || 'Profile saved successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="overflow-hidden rounded-xl border border-[#eceef1] bg-white">
      <div className="flex h-12 items-center justify-between gap-3 border-b border-[#eceef1] px-5">
        <h2 className="text-sm font-semibold text-[#002045]">Your profile</h2>
        {profile.role && (
          <span className="rounded-full bg-[#f2f4f6] px-2.5 py-1 text-[11px] font-semibold text-[#42546a]">
            {profile.role === 'ADMIN' ? 'Administrator' : profile.role}
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-[12px] font-medium text-[#5b616b]">
            Name
            <input required maxLength={100} autoComplete="name" disabled={loading || saving} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[12px] font-medium text-[#5b616b]">
            Email
            <input required type="email" autoComplete="email" disabled={loading || saving} value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className={`${inputClass} mt-1`} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block text-[12px] font-medium text-[#5b616b]">
            Current password <span className="font-normal text-[#9298a2]">(required for email/password changes)</span>
            <input type="password" autoComplete="current-password" disabled={loading || saving} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[12px] font-medium text-[#5b616b]">
            New password <span className="font-normal text-[#9298a2]">(optional)</span>
            <input type="password" autoComplete="new-password" minLength={8} disabled={loading || saving} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[12px] font-medium text-[#5b616b]">
            Confirm new password
            <input type="password" autoComplete="new-password" disabled={loading || saving} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#f2f4f6] pt-4">
          <p className="text-[11px] text-[#74777f]">Your account role stays the same when you update your profile.</p>
          <button type="submit" disabled={loading || saving} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c] disabled:opacity-50">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Icon name="check" size={18} />}
            Save profile
          </button>
        </div>
      </div>
    </form>
  );
}
