'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface PaymentFormProps {
  planType: string;
  amount: number;
  onSuccess?: (transactionId: string) => void | Promise<void>;
}

const localT = {
  en: {
    mobileMoney: 'Mobile Money',
    bankTransfer: 'Bank Transfer',
    nameUsedToPay: 'NAME USED TO PAY *',
    namePlaceholder: 'Full name on the account',
    transactionIdRef: 'TRANSACTION ID / REFERENCE *',
    transactionIdPlaceholder: 'e.g. TXN2026...',
    activationNotice: 'Your ad activates within 15 minutes of payment confirmation.',
    termsAgree: "I agree to House in Mozambique's",
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    adAccurate: '. This ad is accurate.',
    publishAd: 'Publish Ad',
    processing: 'Processing...',
    bank: 'Bank',
    accountName: 'Account Name',
    accountNumber: 'Account Number',
    amountLabel: 'Amount',
    dial: 'Dial',
    or: 'or',
    enterMerchantCode: 'Enter merchant code',
    andConfirm: 'and confirm',
    enterTransactionRef: 'Enter the transaction reference below.',
    fillRequired: 'Please fill in all required fields and accept the terms.',
    paymentFailed: 'Submission failed. Please try again.',
    back: 'Back',
  },
  pt: {
    mobileMoney: 'Dinheiro Móvel',
    bankTransfer: 'Transferência Bancária',
    nameUsedToPay: 'NOME USADO PARA PAGAR *',
    namePlaceholder: 'Nome completo na conta',
    transactionIdRef: 'ID DA TRANSAÇÃO / REFERÊNCIA *',
    transactionIdPlaceholder: 'ex: TXN2026...',
    activationNotice: 'O seu anúncio é ativado no prazo de 15 minutos após a confirmação do pagamento.',
    termsAgree: 'Concordo com os',
    termsOfService: 'Termos de Serviço',
    and: 'e a',
    privacyPolicy: 'Política de Privacidade',
    adAccurate: 'da House in Mozambique. Este anúncio é preciso.',
    publishAd: 'Publicar Anúncio',
    processing: 'Processando...',
    bank: 'Banco',
    accountName: 'Nome da Conta',
    accountNumber: 'Número da Conta',
    amountLabel: 'Valor',
    dial: 'Marque',
    or: 'ou',
    enterMerchantCode: 'Insira o código do comerciante',
    andConfirm: 'e confirme',
    enterTransactionRef: 'Insira a referência da transação abaixo.',
    fillRequired: 'Por favor, preencha todos os campos obrigatórios e aceite os termos.',
    paymentFailed: 'A submissão falhou. Por favor, tente novamente.',
    back: 'Voltar',
  }
};

export default function PaymentForm({ planType, amount, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const curT = localT[lang === 'pt' ? 'pt' : 'en'];

  const [activeTab, setActiveTab] = useState<'mobile' | 'bank'>('mobile');
  const [payerName, setPayerName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // User profile loaded from backend
  const [userProfile, setUserProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserProfile({
              id: data.user.id || '',
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
            });
            setPayerName(data.user.name || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load user profile for payments:', err);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!payerName.trim() || !transactionRef.trim() || !agreedToTerms) {
      setError(curT.fillRequired);
      return;
    }

    if (!userProfile.id) {
      setError('Unable to determine authenticated user. Please sign in and try again.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'MZN',
          method: 'manual',
          planType,
          userId: userProfile.id || '',
          customerName: payerName,
          customerEmail: userProfile.email || 'billing@houseinmoz.com',
          paymentReference: transactionRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || curT.paymentFailed);

      await onSuccess?.(data.transactionId || data.orderRef || 'manual');
      setIsProcessing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : curT.paymentFailed);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${
              activeTab === 'mobile'
                ? 'bg-[#845326] text-white border-[#845326] shadow-md shadow-[#845326]/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">smartphone</span>
            {curT.mobileMoney}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${
              activeTab === 'bank'
                ? 'bg-[#845326] text-white border-[#845326] shadow-md shadow-[#845326]/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">account_balance</span>
            {curT.bankTransfer}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instruction Box */}
          {activeTab === 'mobile' && (
            <div className="bg-[#f7f9fb] border border-[#dde3e8] rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#845326] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p className="text-[#002045] font-medium text-sm pt-1">
                  {curT.dial} <strong>*150#</strong> (M-Pesa) {curT.or} <strong>*156#</strong> (e-Mola)
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#845326] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p className="text-[#002045] font-medium text-sm pt-1">
                  {curT.enterMerchantCode} <span className="bg-white px-2 py-0.5 rounded border border-[#dde3e8] text-black">102934</span> {curT.andConfirm} <strong>{amount.toLocaleString()} MZN</strong>
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#845326] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p className="text-[#002045] font-medium text-sm pt-1">
                  {curT.enterTransactionRef}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="border border-slate-200 rounded-xl p-6 space-y-4 bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-500 mb-1 sm:mb-0">{curT.bank}</span>
                <span className="font-bold text-slate-800">Millennium bim</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-500 mb-1 sm:mb-0">{curT.accountName}</span>
                <span className="font-bold text-slate-800">House in Mozambique, Lda</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-500 mb-1 sm:mb-0">{curT.accountNumber}</span>
                <span className="font-bold text-slate-800">123 456 789 101</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                <span className="text-slate-500 mb-1 sm:mb-0">{curT.amountLabel}</span>
                <span className="font-bold text-slate-800">{amount.toLocaleString()} MZN</span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                {curT.nameUsedToPay}
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder={curT.namePlaceholder}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-[#845326] focus:ring-1 focus:ring-[#845326]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                {curT.transactionIdRef}
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={curT.transactionIdPlaceholder}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-[#845326] focus:ring-1 focus:ring-[#845326]"
                required
              />
            </div>
            <p className="text-sm text-slate-400">
              {curT.activationNotice}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Footer Form Controls */}
      <div className="space-y-6">
        {/* Terms Checkbox */}
        <div className="border border-slate-200 bg-white rounded-xl p-5 flex items-start gap-3 shadow-sm">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-5 h-5 accent-[#845326] cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none">
            {curT.termsAgree}{' '}
            <a href="#" className="text-[#845326] font-semibold hover:underline">{curT.termsOfService}</a>{' '}
            {curT.and}{' '}
            <a href="#" className="text-[#845326] font-semibold hover:underline">{curT.privacyPolicy}</a>
            {curT.adAccurate}
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-between items-center pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-white text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {curT.back}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-8 py-3 bg-[#845326] text-white text-sm font-bold rounded-lg hover:bg-[#6c431f] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            {isProcessing ? curT.processing : curT.publishAd}
          </button>
        </div>
      </div>
    </div>
  );
}
