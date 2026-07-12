# ServeUp

A premium QR-based ordering and WhatsApp-integrated loyalty platform built with **Supabase**, **React**, and **Tailwind CSS**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  React   │ │ Tailwind │ │ shadcn   │ │  Supabase    │  │
│  │  Router  │ │   CSS    │ │   UI     │ │   Client     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   SUPABASE      │
                    │                 │
│  ┌──────────────┐│  ┌───────────┐  │┌──────────────┐
│  │  PostgreSQL  ││  │   Auth    │  ││   Storage    │
│  │  (Database)  ││  │ (Phone    │  ││  (Images)    │
│  │              ││  │  OTP)     │  ││              │
│  │  • Merchants ││  └───────────┘  │└──────────────┘
│  │  • Customers ││                 │
│  │  • Orders    ││  ┌───────────┐  │┌──────────────┐
│  │  • Products  ││  │ Realtime  │  ││ Edge Functions│
│  │  • Loyalty   ││  │ (WebSocket)│ ││              │
│  └──────────────┘│  └───────────┘  ││ • Razorpay   │
│                  │                 ││   Webhook    │
│                  │  ┌───────────┐  ││ • QR Gen     │
│                  │  │  RLS      │  │└──────────────┘
│                  │  │ Policies  │  │
│                  │  └───────────┘  │
│                  └─────────────────┘
```

## Features

- **QR Code Menus** - Generate branded QR codes for instant digital menu access
- **WhatsApp Loyalty** - Automatic visit tracking and reward notifications
- **Real-time Orders** - Kitchen display system with live order updates
- **Secure Payments** - Razorpay integration with UPI support
- **Analytics Dashboard** - Revenue tracking, peak hours, customer insights
- **Super Admin Panel** - Multi-tenant management tools

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Payments | Razorpay |
| Charts | Custom CSS Charts |

## Database Schema

### Core Tables

- **merchants** - Business profiles with branding settings
- **customers** - Global customer identities (phone-based)
- **merchant_customers** - Per-merchant loyalty state
- **categories** - Product categories per merchant
- **products** - Menu items with attributes (dietary, variants)
- **orders** - Order records with payment status
- **order_items** - Line items for each order
- **loyalty_rules** - Visit-based reward configuration

### Analytics Functions

- `get_dashboard_kpis()` - Revenue, orders, AOV, customers
- `get_revenue_trends()` - Daily revenue aggregation
- `get_peak_hours()` - Hourly order volume analysis
- `get_system_gmv()` - Platform-wide gross merchandise value
- `get_industry_distribution()` - Merchant segmentation

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_init_schema.sql`
3. Enable **Phone Auth** in Authentication > Providers
4. Create a **Storage bucket** named `merchant-assets` (public)
5. Deploy Edge Functions:

```bash
supabase functions deploy razorpay-webhook
supabase functions deploy generate-qr
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview |
| `/m/:slug` | Public merchant menu (QR landing) |
| `/orders/success` | Order confirmation |
| `/dashboard` | Merchant analytics dashboard |
| `/kitchen` | Kitchen display system |
| `/admin` | Super admin panel |

## Edge Functions

### razorpay-webhook
Validates Razorpay webhook signatures and updates order status + loyalty progress.

### generate-qr
Generates QR codes for merchant slugs and uploads to Supabase Storage.

## RLS Policies

All tables have Row Level Security enabled:
- Public read access to active merchants, categories, and products
- Authenticated users can only read their own customer data and orders
- Merchant data is tenant-isolated via `merchant_id`

## License

MIT
