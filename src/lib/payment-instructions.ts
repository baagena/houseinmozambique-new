import { prisma } from '@/lib/db';

/**
 * Where the money is supposed to go.
 *
 * A manual payment flow is only as good as these details. If the agent cannot
 * see the number to send to, the whole path collapses back into a WhatsApp
 * conversation with somebody on the team — which is where it was before.
 *
 * They live in AppSetting rather than in code or in the environment because
 * they change: a bank account is replaced, an M-Pesa number moves to a new
 * handset, a second wallet is added. An admin has to be able to correct them
 * without a deploy, and the correction has to be visible to every agent the
 * moment it is saved.
 *
 * EVERY FIELD DEFAULTS TO EMPTY, DELIBERATELY. There is no placeholder account
 * number, because a plausible-looking one that nobody owns is worse than a
 * blank: an agent would send real money to it. `hasAnyDestination()` is what
 * the UI checks, and it tells the agent to contact the team rather than
 * inventing somewhere to pay.
 */
export interface PaymentInstructions {
  /** The name the account is held in — payers check this before sending. */
  accountName: string;
  mpesaNumber: string;
  emolaNumber: string;
  bankName: string;
  bankAccount: string;
  bankIban: string;
  /** Free text: opening hours, who to ask for, anything the fields miss. */
  notes: string;
}

export const PAYMENT_INSTRUCTION_KEYS = [
  'payAccountName',
  'payMpesaNumber',
  'payEmolaNumber',
  'payBankName',
  'payBankAccount',
  'payBankIban',
  'payNotes',
] as const;

export const EMPTY_INSTRUCTIONS: PaymentInstructions = {
  accountName: '',
  mpesaNumber: '',
  emolaNumber: '',
  bankName: '',
  bankAccount: '',
  bankIban: '',
  notes: '',
};

/** True when there is at least one place an agent could actually send money. */
export function hasAnyDestination(i: PaymentInstructions): boolean {
  return Boolean(i.mpesaNumber || i.emolaNumber || i.bankAccount || i.bankIban);
}

export async function getPaymentInstructions(): Promise<PaymentInstructions> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: [...PAYMENT_INSTRUCTION_KEYS] } },
      select: { key: true, value: true },
    });
    const v = Object.fromEntries(rows.map((r) => [r.key, r.value.trim()]));
    return {
      accountName: v.payAccountName || '',
      mpesaNumber: v.payMpesaNumber || '',
      emolaNumber: v.payEmolaNumber || '',
      bankName: v.payBankName || '',
      bankAccount: v.payBankAccount || '',
      bankIban: v.payBankIban || '',
      notes: v.payNotes || '',
    };
  } catch (error) {
    // The billing page must still render if this lookup fails — the agent can
    // read their plan and history even when we cannot tell them where to pay.
    console.error('payment-instructions: could not read settings', error);
    return EMPTY_INSTRUCTIONS;
  }
}

export async function savePaymentInstructions(input: Partial<PaymentInstructions>) {
  const next: Record<(typeof PAYMENT_INSTRUCTION_KEYS)[number], string> = {
    payAccountName: (input.accountName ?? '').trim(),
    payMpesaNumber: (input.mpesaNumber ?? '').trim(),
    payEmolaNumber: (input.emolaNumber ?? '').trim(),
    payBankName: (input.bankName ?? '').trim(),
    payBankAccount: (input.bankAccount ?? '').trim(),
    payBankIban: (input.bankIban ?? '').trim(),
    payNotes: (input.notes ?? '').trim(),
  };

  await prisma.$transaction(
    Object.entries(next).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  return next;
}
