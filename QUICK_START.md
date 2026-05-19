# 🚀 Quick Start Guide - House in Mozambique

## 📋 Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL database (Neon DB configured)
- Git for version control

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables
Create/Update `.env` file in project root:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME="dcauevdfw"
CLOUDINARY_API_KEY="844262751221861"
CLOUDINARY_API_SECRET="m7zxrlTk78_0YqS48sDbq2fFiRk"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@houseinmozambique.com"
CONTACT_EMAIL="contact@houseinmozambique.com"
ADMIN_EMAIL="admin@houseinmozambique.com"

# Payment Methods
MPESA_API_KEY="your-mpesa-api-key"
EMOLA_API_KEY="your-emola-api-key"
STRIPE_API_KEY="your-stripe-api-key"
STRIPE_PUBLIC_KEY="your-stripe-public-key"
```

### 3. Database Setup
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 📱 Key Pages

### Public Pages
- **Home:** `/` - Landing page with featured properties
- **Properties:** `/properties` - Browse all listings
- **Pricing:** `/pricing` - Subscription tiers and payment info
- **Agents:** `/agents` - Featured real estate agents
- **Contact:** `/contact` - Contact form
- **About:** `/about` - About the platform

### Agent/User Pages
- **Auth:** `/auth` - Login/Register
- **Dashboard:** `/dashboard/agent` - Agent dashboard
- **Post Property:** `/post-property` - List a new property

### Admin Pages
- **Admin Dashboard:** `/dashboard/admin` - Platform analytics
- **Approvals:** `/dashboard/admin/approvals` - Review listings
- **Agents Management:** `/dashboard/admin/agents` - Manage agents

---

## 💳 Payment Integration

### Enable Payment Methods

#### M-Pesa (VoguePay)
1. Register at https://voguepay.com/
2. Get API key
3. Add to `.env`: `MPESA_API_KEY=...`

#### e-Mola
1. Register at https://emola.co.mz/
2. Get API key
3. Add to `.env`: `EMOLA_API_KEY=...`

#### Credit/Debit Cards (Stripe)
1. Create account at https://stripe.com/
2. Get API keys
3. Add to `.env`: `STRIPE_API_KEY=...`

### Test Payments
Use sandbox credentials provided by each payment provider. No real transactions will occur during testing.

---

## 📊 Dashboard Features

### Admin Dashboard Includes:
- 📈 **Analytics Charts** - 30-day activity trends
- 📊 **Revenue Tracking** - Financial overview
- 👥 **Agent Management** - View and approve agents
- 🏠 **Property Analytics** - Listing performance
- 📧 **Inquiry Feed** - Recent contact form submissions
- 🔍 **System Health** - Platform status monitoring

---

## 📧 Email Configuration

### Set Up SendGrid
1. Create account at https://sendgrid.com/
2. Generate API key
3. Verify sender email
4. Add to `.env`:
   ```env
   SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
   SENDGRID_FROM_EMAIL="noreply@houseinmozambique.com"
   ```

### Email Triggers
- ✉️ Contact form submission → Admin + user confirmation
- ✉️ Property inquiry → Agent notification
- ✉️ Payment confirmation → User receipt

---

## 🔧 Build & Deploy

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Environment-Specific Variables
Ensure production `.env` contains:
- Live database credentials
- Real API keys (not test/sandbox keys)
- Production email addresses
- Live payment gateway keys

---

## 📚 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── (public pages)
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── home/             # Homepage components
│   └── layout/           # Layout components
├── lib/                   # Utilities & services
│   ├── auth.ts           # Authentication
│   ├── db.ts             # Database client
│   ├── email.ts          # Email service
│   ├── payment.ts        # Payment service
│   └── data.ts           # Data fetching
└── types/                # TypeScript types
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Payment Flow
1. Navigate to `/pricing`
2. Select a plan
3. Complete payment with test credentials
4. Verify transaction in admin dashboard

### Test Email
1. Go to `/contact`
2. Fill and submit form
3. Check SendGrid logs for delivery

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3001 npm run dev
```

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npx prisma migrate dev`

### Missing Environment Variables
```bash
# Copy template and fill values
cp .env.example .env
# Edit .env with your credentials
```

### Build Fails
```bash
# Clean build cache
rm -rf .next
npm run build
```

---

## 📞 Support Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Payment Providers
- [M-Pesa/VoguePay](https://voguepay.com/docs)
- [e-Mola](https://emola.co.mz/developers)
- [Stripe](https://stripe.com/docs)

### Email Service
- [SendGrid Docs](https://docs.sendgrid.com/)

---

## ✅ Verification Checklist

- [ ] All dependencies installed
- [ ] `.env` file configured
- [ ] Database migrations completed
- [ ] Development server starts without errors
- [ ] Home page loads correctly
- [ ] Pricing page displays all 4 tiers
- [ ] Admin dashboard shows charts
- [ ] Contact form works and sends emails
- [ ] Payment options appear in pricing

---

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Configure payment providers
3. ✅ Test all features locally
4. ✅ Deploy to production
5. ✅ Monitor transactions and emails
6. ✅ Gather user feedback

---

## 📝 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma migrate dev   # Run migrations
npx prisma studio       # Open Prisma Studio GUI
npx prisma db seed      # Seed database

# Linting
npm run lint            # Run ESLint

# Deployment
npm run build && npm run start
```

---

**Last Updated:** May 19, 2026
**Version:** 1.0.0
**Status:** ✅ Ready to Use

For detailed documentation, see:
- `IMPLEMENTATION_SUMMARY.md` - Full feature overview
- `PAYMENT_INTEGRATION.md` - Payment system guide
