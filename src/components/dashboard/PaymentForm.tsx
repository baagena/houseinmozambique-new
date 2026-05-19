'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface PaymentFormProps {
  planType: string;
  amount: number;
  onSuccess?: (transactionId: string) => void;
}

export default function PaymentForm({ planType, amount, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    currency: 'MZN',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      // Validate form
      if (!formData.customerName || !formData.customerEmail) {
        setError('Please fill in all required fields');
        setIsProcessing(false);
        return;
      }

      // Call payment API
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: formData.currency,
          method: paymentMethod,
          planType,
          userId: localStorage.getItem('userId'), // Get from your auth context
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (data.success) {
        onSuccess?.(data.transactionId);
        // Redirect or show success message
        alert('Payment initiated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Pay using M-Pesa mobile money',
      icon: '📱',
    },
    {
      id: 'emola',
      name: 'e-Mola',
      description: 'Pay using e-Mola wallet',
      icon: '💳',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard, or local cards',
      icon: '💰',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-black text-[#002045] mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
        Complete Payment
      </h2>
      <p className="text-[#74777f] mb-8">Choose your preferred payment method</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Payment Amount Summary */}
        <div className="bg-[#f7f9fb] rounded-xl p-6 border-l-4 border-[#845326]">
          <p className="text-sm text-[#74777f] uppercase tracking-wider mb-2">Plan</p>
          <h3 className="text-2xl font-black text-[#002045] mb-4">
            {planType.charAt(0).toUpperCase() + planType.slice(1)}
          </h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#74777f] text-sm mb-1">Amount</p>
              <p className="text-3xl font-black text-[#845326]">
                {amount.toLocaleString('pt-MZ', {
                  style: 'currency',
                  currency: formData.currency,
                })}
              </p>
            </div>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="px-3 py-2 rounded-lg border border-[#f2f4f6] text-sm"
            >
              <option value="MZN">MZN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <label className="text-sm font-black text-[#002045] uppercase tracking-wider">
            Payment Method
          </label>
          <div className="grid grid-cols-1 gap-4">
            {paymentMethods.map(method => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === method.id
                    ? 'border-[#845326] bg-[#845326]/5'
                    : 'border-[#f2f4f6] hover:border-[#845326]/30'
                }`}
                onClick={() => setPaymentMethod(method.id as 'mpesa' | 'emola' | 'card')}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as 'mpesa' | 'emola' | 'card')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-black text-[#002045]">{method.name}</p>
                    <p className="text-sm text-[#74777f]">{method.description}</p>
                  </div>
                  <span className="text-2xl">{method.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <label className="text-sm font-black text-[#002045] uppercase tracking-wider">
            Your Information
          </label>
          <div>
            <label className="block text-xs text-[#74777f] mb-2 font-semibold">Full Name *</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Your name"
              required
              className="w-full px-4 py-2 border border-[#f2f4f6] rounded-lg focus:outline-none focus:border-[#845326]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#74777f] mb-2 font-semibold">Email *</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border border-[#f2f4f6] rounded-lg focus:outline-none focus:border-[#845326]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#74777f] mb-2 font-semibold">Phone Number</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              placeholder="+258 XXX XXX XXX"
              className="w-full px-4 py-2 border border-[#f2f4f6] rounded-lg focus:outline-none focus:border-[#845326]"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-4 bg-[#845326] text-white font-black rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : `Pay ${amount.toLocaleString()} MZN`}
        </button>

        {/* Security Notice */}
        <p className="text-xs text-[#74777f] text-center">
          🔒 Your payment information is secure and encrypted. We accept M-Pesa, e-Mola, and international cards.
        </p>
      </form>
    </div>
  );
}
