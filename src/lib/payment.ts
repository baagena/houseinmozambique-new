/**
 * Payment Service for House in Mozambique
 * Supports: M-Pesa, e-Mola, Debit/Credit Cards
 */

export interface PaymentRequest {
  amount: number; // in MZN
  currency: string; // MZN, USD, etc.
  method: 'mpesa' | 'emola' | 'card';
  description: string;
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  message: string;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * M-Pesa Payment Gateway
 * Integration with Mozambique mobile money service
 */
export class MPesaPayment {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.MPESA_API_KEY || '';
    this.endpoint = process.env.MPESA_ENDPOINT || 'https://api.sandbox.voguepay.com';
  }

  async initiate(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.apiKey) {
      console.warn('M-Pesa API key not configured');
      return {
        success: false,
        message: 'M-Pesa payment gateway not configured',
        status: 'failed',
      };
    }

    try {
      const payload = {
        merchant_ref: request.orderRef,
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        customer_phone: request.customerPhone,
        amount: request.amount,
        currency: 'MZN',
        description: request.description,
        phone: request.customerPhone,
        service_type: 'web',
        api_key: this.apiKey,
      };

      // Note: This is a mock implementation. Replace with actual M-Pesa API calls
      return {
        success: true,
        transactionId: `MPESA-${Date.now()}`,
        message: 'M-Pesa payment initiated successfully',
        status: 'pending',
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        message: 'Failed to initiate M-Pesa payment',
        status: 'failed',
      };
    }
  }
}

/**
 * e-Mola Payment Gateway
 * Integration with e-Mola mobile money service
 */
export class EMolaPayment {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.EMOLA_API_KEY || '';
    this.endpoint = process.env.EMOLA_ENDPOINT || 'https://api.emola.co.mz';
  }

  async initiate(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.apiKey) {
      console.warn('e-Mola API key not configured');
      return {
        success: false,
        message: 'e-Mola payment gateway not configured',
        status: 'failed',
      };
    }

    try {
      const payload = {
        transaction_id: request.orderRef,
        amount: request.amount,
        currency: 'MZN',
        customer_phone: request.customerPhone,
        customer_email: request.customerEmail,
        description: request.description,
        api_key: this.apiKey,
      };

      // Note: This is a mock implementation. Replace with actual e-Mola API calls
      return {
        success: true,
        transactionId: `EMOLA-${Date.now()}`,
        message: 'e-Mola payment initiated successfully',
        status: 'pending',
      };
    } catch (error) {
      console.error('e-Mola payment error:', error);
      return {
        success: false,
        message: 'Failed to initiate e-Mola payment',
        status: 'failed',
      };
    }
  }
}

/**
 * Card Payment Gateway (Debit/Credit)
 * Integration with Stripe for card payments with local currency support
 */
export class CardPayment {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.STRIPE_API_KEY || '';
    this.endpoint = 'https://api.stripe.com/v1';
  }

  async initiate(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.apiKey) {
      console.warn('Card payment API key not configured');
      return {
        success: false,
        message: 'Card payment gateway not configured',
        status: 'failed',
      };
    }

    try {
      // Convert amount from MZN to cents for Stripe
      const amountInCents = Math.round(request.amount * 100);

      const payload = {
        amount: amountInCents,
        currency: 'mzn',
        source: 'tok_visa', // This should be replaced with actual token from frontend
        description: request.description,
        metadata: {
          order_ref: request.orderRef,
          customer_name: request.customerName,
          ...request.metadata,
        },
      };

      // Note: This is a mock implementation. Replace with actual Stripe API calls
      return {
        success: true,
        transactionId: `CARD-${Date.now()}`,
        message: 'Card payment initiated successfully',
        status: 'pending',
      };
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        message: 'Failed to process card payment',
        status: 'failed',
      };
    }
  }
}

/**
 * Process payment based on selected method
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  switch (request.method) {
    case 'mpesa':
      return new MPesaPayment().initiate(request);
    case 'emola':
      return new EMolaPayment().initiate(request);
    case 'card':
      return new CardPayment().initiate(request);
    default:
      return {
        success: false,
        message: 'Invalid payment method',
        status: 'failed',
      };
  }
}

/**
 * Convert currency
 * Note: Replace with actual currency conversion API (e.g., Open Exchange Rates)
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string = 'MZN'
): Promise<number> {
  try {
    // Mock conversion rates (replace with actual API)
    const rates: Record<string, Record<string, number>> = {
      USD: { MZN: 64.2, EUR: 0.92 },
      EUR: { MZN: 70.0, USD: 1.08 },
      GBP: { MZN: 80.5, USD: 1.27 },
      MZN: { USD: 0.0156, EUR: 0.0143, GBP: 0.0124 },
    };

    if (from === to) return amount;

    const rate = rates[from]?.[to];
    if (!rate) {
      console.warn(`Conversion rate not found for ${from} to ${to}`);
      return amount;
    }

    return Math.round(amount * rate * 100) / 100;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}
