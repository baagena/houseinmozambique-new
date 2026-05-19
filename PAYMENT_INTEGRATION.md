# House in Mozambique - Payment Integration Guide

## Overview
This guide documents the payment system integration for House in Mozambique, supporting multiple payment methods for the new pricing structure.

## Supported Payment Methods

### 1. **M-Pesa**
- Mobile money service in Mozambique
- API Integration: VoguePay (Sandbox available)
- Transaction Processing: Real-time
- **Setup Required:**
  - Register with VoguePay
  - Get API Key
  - Add to `.env`: `MPESA_API_KEY=your-api-key`

### 2. **e-Mola**
- Digital wallet service in Mozambique
- API Integration: e-Mola Direct API
- Transaction Processing: Real-time
- **Setup Required:**
  - Register with e-Mola
  - Get API credentials
  - Add to `.env`: `EMOLA_API_KEY=your-api-key`

### 3. **Debit/Credit Cards**
- International card support
- API Integration: Stripe
- Transaction Processing: Real-time
- Supports: Visa, Mastercard, local cards
- **Setup Required:**
  - Create Stripe account
  - Get API keys
  - Add to `.env`: `STRIPE_API_KEY` and `STRIPE_PUBLIC_KEY`

## Pricing Structure

### Standard (Free)
- **Cost:** Free
- **Listings:** 1 property
- **Features:** Basic listing, 15 photos, email support

### Premium
- **Cost:** 7,000 - 15,000 MZN/month
- **Listings:** Up to 15 properties
- **Features:** Featured exposure, 30 photos per property, social promotion, priority support

### Agency Pro
- **Cost:** 30,000 - 50,000 MZN/month
- **Listings:** Unlimited
- **Features:** CRM integration, unlimited photos, advanced analytics, 24/7 support

### Premium Ad Boosts
- **Cost:** 2,000 MZN/week
- **Duration:** 7 days
- **Features:** Top placement, homepage featured, social boost

## Environment Configuration

### 1. Create/Update `.env` file with:

```env
# Payment Gateways
MPESA_API_KEY="your-mpesa-api-key"
MPESA_ENDPOINT="https://api.sandbox.voguepay.com"

EMOLA_API_KEY="your-emola-api-key"
EMOLA_ENDPOINT="https://api.emola.co.mz"

STRIPE_API_KEY="your-stripe-secret-key"
STRIPE_PUBLIC_KEY="your-stripe-public-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Email Configuration
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@houseinmozambique.com"

# Optional: Currency Conversion
EXCHANGE_RATES_API_KEY="your-exchange-rates-api-key"
```

## API Endpoints

### 1. **POST /api/payments**
Initiate a payment

**Request:**
```json
{
  "amount": 10000,
  "currency": "MZN",
  "method": "mpesa",
  "planType": "premium",
  "userId": "user-id",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+258 84 123 4567"
}
```

**Response:**
```json
{
  "success": true,
  "orderRef": "HIM-1234567890-abc123",
  "transactionId": "MPESA-1234567890",
  "message": "Payment initiated successfully"
}
```

### 2. **POST /api/payments/webhook**
Receive payment confirmation from providers

**Request (from Payment Provider):**
```json
{
  "orderRef": "HIM-1234567890-abc123",
  "transactionId": "MPESA-1234567890",
  "status": "success",
  "method": "mpesa",
  "amount": 10000
}
```

## Database Schema

### Payment Model
```prisma
model Payment {
  id              String   @id @default(cuid())
  orderRef        String   @unique
  amount          Float
  currency        String   @default("MZN")
  method          String   // "mpesa", "emola", "card"
  planType        String   // "standard", "premium", "pro", "boost"
  userId          String
  transactionId   String?
  customerName    String
  customerEmail   String
  customerPhone   String?
  status          String   @default("PENDING")
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Integration Steps

### 1. **Set up Payment Provider Accounts**
- M-Pesa: Register at https://voguepay.com/
- e-Mola: Register at https://emola.co.mz/
- Stripe: Register at https://stripe.com/

### 2. **Configure Environment Variables**
Update `.env` with API keys from each provider

### 3. **Update Prisma Database**
```bash
npx prisma migrate dev --name add_payment_model
```

### 4. **Run Application**
```bash
npm run dev
```

## Testing Payment Flow

### 1. **Test with Sandbox Credentials**
All payment providers offer sandbox environments for testing:
- M-Pesa/VoguePay: Uses sandbox API endpoint
- e-Mola: Provides test credentials
- Stripe: Uses test API keys (starts with `sk_test_`)

### 2. **Test Transactions**
```bash
# Test M-Pesa
POST /api/payments
{
  "amount": 100,
  "currency": "MZN",
  "method": "mpesa",
  "planType": "premium",
  "userId": "test-user",
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "customerPhone": "+258 84 123 4567"
}
```

## Currency Conversion

The system supports automatic currency conversion:
- **Supported Currencies:** USD, EUR, GBP, MZN
- **Conversion API:** Open Exchange Rates (optional)
- **Default:** All amounts stored in MZN

### Example Conversion
```javascript
const amountInUSD = 150;
const amountInMZN = await convertCurrency(150, 'USD', 'MZN');
// Result: ~9,630 MZN (based on current rates)
```

## Security Considerations

1. **SSL/TLS:** All payment endpoints use HTTPS
2. **API Keys:** Never commit `.env` to version control
3. **Webhook Verification:** Implement signature verification for webhooks
4. **Data Encryption:** Payment data is encrypted in transit and at rest
5. **PCI Compliance:** All card data handled by Stripe (no direct storage)

## Troubleshooting

### Payment Fails with "API Key Not Configured"
- Verify `.env` file contains the correct API key
- Ensure environment variables are loaded
- Check API key format and expiration

### Webhook Not Received
- Verify webhook URL in payment provider dashboard
- Check firewall/security group settings
- Implement webhook retry logic

### Currency Conversion Issues
- Verify currency codes (USD, EUR, GBP, MZN)
- Check if conversion API credentials are provided
- Review conversion rate documentation

## Support

For issues or questions:
- M-Pesa/VoguePay: https://voguepay.com/support
- e-Mola: https://emola.co.mz/support
- Stripe: https://stripe.com/docs/support

## Next Steps

1. ✅ Configure payment gateway accounts
2. ✅ Add API keys to `.env`
3. ✅ Run database migrations
4. ✅ Test payment flow with sandbox
5. ✅ Deploy to production with live API keys
6. ✅ Monitor transaction logs
7. ✅ Set up automated reconciliation

---

**Last Updated:** May 19, 2026
**Version:** 1.0.0
