'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import type { PaymentInstructions } from '@/lib/payment-instructions';

type Settings = {
  adminName: string;
  adminEmail: string;
  platformTagline: string;
  globalNotifications: boolean;
  agentApprovalAlerts: boolean;
  weeklyReport: boolean;
};

const EMPTY_PAY: PaymentInstructions = {
  accountName: '', mpesaNumber: '', emolaNumber: '',
  bankName: '', bankAccount: '', bankIban: '', notes: '',
};

/*
 * Every field starts blank and stays blank until an admin types a real one.
 * There is no placeholder account number anywhere in this flow: an agent shown
 * a plausible-looking number that nobody owns would send real money to it.
 */
const PAY_FIELDS: { key: keyof PaymentInstructions; label: string; hint: string; wide?: boolean }[] = [
  { key: 'accountName', label: 'Account name', hint: 'The name payers will see when they confirm the transfer.', wide: true },
  { key: 'mpesaNumber', label: 'M-Pesa number', hint: 'Vodacom. Shown first, because most payments arrive this way.' },
  { key: 'emolaNumber', label: 'e-Mola number', hint: 'Movitel. Leave blank if you do not take e-Mola.' },
  { key: 'bankName', label: 'Bank', hint: 'e.g. BCI, Millennium bim, Standard Bank.' },
  { key: 'bankAccount', label: 'Account number', hint: 'For domestic transfers.' },
  { key: 'bankIban', label: 'IBAN / NIB', hint: 'For transfers from outside Mozambique.' },
];

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) throw new Error(`The server returned an empty response (${response.status}).`);

  try {
    return JSON.parse(text) as {
      settings?: Settings;
      paymentInstructions?: PaymentInstructions;
      freeRentalCeiling?: string;
      error?: string;
    };
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
}

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Settings>({
    adminName: 'Dev Admin',
    adminEmail: 'admin@houseinmozambique.com',
    platformTagline: 'The Modern Estate Curator',
    globalNotifications: true,
    agentApprovalAlerts: true,
    weeklyReport: false,
  });
  const [pay, setPay] = useState<PaymentInstructions>(EMPTY_PAY);
  /* Blank means the exemption is off, which is its default. */
  const [freeCeiling, setFreeCeiling] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(async (response) => {
        const data = await readResponse(response);
        if (!response.ok) throw new Error(data.error || 'Could not load settings.');
        if (!data.settings) throw new Error('The server did not return settings.');
        setFormData(data.settings);
        if (data.paymentInstructions) setPay(data.paymentInstructions);
        setFreeCeiling(data.freeRentalCeiling ?? '');
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, paymentInstructions: pay, freeRentalCeiling: freeCeiling }),
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || 'Could not save settings.');
      if (!data.settings) throw new Error('The server did not return saved settings.');
      setFormData(data.settings);
      if (data.paymentInstructions) setPay(data.paymentInstructions);
      setFreeCeiling(data.freeRentalCeiling ?? '');
      setMessage('Settings updated successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  /* Matches hasAnyDestination() on the server: at least one place money can
     actually go. An account name alone does not make the flow workable. */
  const anyDestination = Boolean(
    pay.mpesaNumber.trim() || pay.emolaNumber.trim() || pay.bankAccount.trim() || pay.bankIban.trim(),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#002045] tracking-tight">Platform settings</h1>
        <p className="mt-1 text-sm text-[#74777f]">
          Configure administrative controls and global notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {isLoading && <p className="text-sm text-[#74777f]">Loading settings...</p>}
        {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Administrative profile</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Admin identity</label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Restricted email</label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Global site tagline</label>
              <input
                type="text"
                value={formData.platformTagline}
                onChange={(e) => setFormData({ ...formData, platformTagline: e.target.value })}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </div>
          </div>
        </div>

        {/* Where manual payments should be sent ---------------------------
            These are the only things an agent is told when they owe money, so
            a blank here is not a cosmetic gap: the billing page has to fall
            back to "contact the team" and the payment stalls. */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center justify-between gap-3 border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Where payments are sent</h3>
            {!anyDestination && !isLoading && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Not set — agents cannot pay
              </span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[12px] leading-relaxed text-[#74777f]">
              Shown on every agent&apos;s billing page beside their payment reference, with a copy
              button on each one. Leave a field blank to hide it. Nothing here is guessed or
              pre-filled &mdash; whatever you type is what agents will send money to, so check it.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAY_FIELDS.map((f) => (
                <div key={f.key} className={f.wide ? 'md:col-span-2' : undefined}>
                  <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{f.label}</label>
                  <input
                    type="text"
                    value={pay[f.key]}
                    onChange={(e) => setPay({ ...pay, [f.key]: e.target.value })}
                    className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                    autoComplete="off"
                  />
                  <p className="mt-1 text-[11px] text-[#9aa0a8]">{f.hint}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">
                Anything else payers should know
              </label>
              <textarea
                value={pay.notes}
                onChange={(e) => setPay({ ...pay, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                placeholder="e.g. transfers are only checked on working days"
              />
            </div>
          </div>
        </div>

        {/* Who lists for free -------------------------------------------
            A free tier defined by what the property is worth, not by a count.
            A quota turns away the person with one cheap flat exactly as firmly
            as the agency with forty — and only one of those two was ever going
            to pay. */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center justify-between gap-3 border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Free listings for modest rentals</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${freeCeiling ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f2f4f6] text-[#74777f]'}`}>
              {freeCeiling ? 'On' : 'Off'}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[12px] leading-relaxed text-[#74777f]">
              A private owner renting out below this figure can publish without a plan, however
              many listings their plan covers. Agencies never qualify, and sales never qualify —
              a sale earns a commission that can carry a fee. Leave it blank to switch the
              exemption off.
            </p>
            <div className="max-w-xs">
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">
                Monthly rent below (MZN)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={freeCeiling}
                onChange={(e) => setFreeCeiling(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
              <p className="mt-1 text-[11px] text-[#9aa0a8]">
                Blank or 0 means no free listings. Nothing is assumed here.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Notification controls</h3>
          </div>
          <div className="px-5">
            {[
              { key: 'globalNotifications', label: 'Push notifications', desc: 'Receive real-time alerts for platform activities.' },
              { key: 'agentApprovalAlerts', label: 'Agent verification alerts', desc: 'Get notified immediately when a new agent applies.' },
              { key: 'weeklyReport', label: 'Executive weekly digest', desc: 'Automated report of platform growth and revenue stats.' },
            ].map((item) => {
              const on = formData[item.key as keyof typeof formData] as boolean;
              return (
                <div key={item.key} className="flex items-center justify-between gap-4 py-4 border-b border-[#f2f4f6] last:border-0">
                  <div className="leading-snug">
                    <p className="text-[13px] font-medium text-[#002045]">{item.label}</p>
                    <p className="text-[12px] text-[#9aa0a8]">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, [item.key]: !on })}
                    className={`relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? 'bg-[#002045]' : 'bg-[#d7dbe0]'}`}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c] disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name="check" size={18} />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
