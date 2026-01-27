# Setup & Deployment Guide

This guide walks you through setting up all required services and deploying the White-Label Appointment Booking Agent.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Supabase Setup](#1-supabase-setup)
4. [Razorpay Setup](#2-razorpay-setup)
5. [Google OAuth Setup](#3-google-oauth-setup)
6. [Email (SMTP) Setup](#4-email-smtp-setup)
7. [Local Development](#5-local-development)
8. [Deploy to Vercel](#6-deploy-to-vercel)
9. [Post-Deployment](#7-post-deployment)

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git
- A GitHub account (for Vercel deployment)

---

## Environment Variables Overview

```env
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay (Payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_PLAN_BASIC=plan_xxxxxxxxxxxx
RAZORPAY_PLAN_PRO=plan_xxxxxxxxxxxx
RAZORPAY_PLAN_AGENCY=plan_xxxxxxxxxxxx

# Google OAuth (Calendar)
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_SECRET=GOCSPX-...

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Email (SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_...
SMTP_FROM=noreply@yourdomain.com

# Security (generate random strings)
INTERNAL_API_KEY=your-random-32-char-string
CRON_SECRET=your-random-32-char-string
```

---

## 1. Supabase Setup

### Step 1: Create Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `appointment-booking` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait ~2 minutes

### Step 2: Get API Keys

1. In your project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Never expose the service_role key publicly!**

### Step 3: Run Database Migrations

**Option A: Using Supabase Dashboard**

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. Repeat for `supabase/migrations/002_add_reminder_sent.sql`

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Step 4: Configure Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your app URL (e.g., `https://your-app.vercel.app`)
5. Add **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

---

## 2. Razorpay Setup

Razorpay is an Indian payment gateway that allows individual developers to accept payments with just a PAN card - no business registration required.

### Step 1: Create Account

1. Go to [razorpay.com](https://razorpay.com) and sign up
2. Complete KYC with your PAN card and bank account details
3. Wait for account activation (usually 1-2 business days)

### Step 2: Get API Keys

1. Go to **Settings** → **API Keys**
2. Click **Generate Key** (or view existing keys)
3. Copy:
   - **Key ID** → `RAZORPAY_KEY_ID` (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

> **Note**: Use test keys (`rzp_test_`) for development, live keys (`rzp_live_`) for production.

### Step 3: Create Subscription Plans

1. Go to **Products** → **Plans**
2. Click **Create Plan**

3. Create **Basic Plan**:
   - Name: `Basic`
   - Period: `monthly`
   - Amount: `240000` (₹2,400 in paise)
   - Click **Create Plan**
   - Copy the **Plan ID** → `RAZORPAY_PLAN_BASIC`

4. Create **Pro Plan**:
   - Name: `Pro`
   - Period: `monthly`
   - Amount: `650000` (₹6,500 in paise)
   - Copy the **Plan ID** → `RAZORPAY_PLAN_PRO`

5. Create **Agency Plan**:
   - Name: `Agency`
   - Period: `monthly`
   - Amount: `1650000` (₹16,500 in paise)
   - Copy the **Plan ID** → `RAZORPAY_PLAN_AGENCY`

### Step 4: Set Up Webhook

1. Go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Set **Webhook URL**: `https://your-app.vercel.app/api/billing/webhook`
4. Select **Active Events**:
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
   - `payment.captured`
   - `payment.failed`
5. Click **Create Webhook**
6. Copy the **Secret** → `RAZORPAY_WEBHOOK_SECRET`

### For Local Testing

Use a tool like [ngrok](https://ngrok.com) to expose your localhost:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, expose localhost
ngrok http 3000

# Copy the HTTPS URL and use it for webhooks
# Example: https://abc123.ngrok.io/api/billing/webhook
```

### Test Mode vs Live Mode

- **Test Mode**: Use `rzp_test_` keys. Card: `4111 1111 1111 1111`, any future expiry, any CVV
- **Live Mode**: Use `rzp_live_` keys after completing full KYC verification

---

## 3. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it (e.g., `appointment-booking`)
4. Click **Create**

### Step 2: Enable Google Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click on it and click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **Save and Continue**
7. Add test users (your email) if in testing mode
8. Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name it (e.g., `Appointment Booking Web`)
5. Add **Authorized redirect URIs**:
   - `https://your-app.vercel.app/api/calendar/callback`
   - `http://localhost:3000/api/calendar/callback`
6. Click **Create**
7. Copy:
   - **Client ID** → `GOOGLE_OAUTH_CLIENT_ID`
   - **Client Secret** → `GOOGLE_OAUTH_SECRET`

### Step 5: Publish App (for Production)

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Confirm to move out of testing mode

> Note: Until published, only test users can connect calendars.

---

## 4. Email (SMTP) Setup

You have several options for email. Here are the most common:

### Option A: Resend (Recommended)

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your domain or use their test domain
3. Go to **API Keys** → **Create API Key**
4. Copy the key

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_xxxxx  # Your API key
SMTP_FROM=noreply@yourdomain.com
```

### Option B: SendGrid

1. Go to [sendgrid.com](https://sendgrid.com) and sign up
2. Go to **Settings** → **API Keys** → **Create API Key**
3. Select **Full Access** and create

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx  # Your API key
SMTP_FROM=noreply@yourdomain.com
```

### Option C: Gmail (Development Only)

1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App password
SMTP_FROM=your-email@gmail.com
```

> ⚠️ Gmail has sending limits. Use a proper email service for production.

---

## 5. Local Development

### Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd White-label-Appointment-Booking-Agent
npm install
```

### Step 2: Create Environment File

Create `.env.local` with all your values:

```bash
# Copy the example
cp .env.example .env.local

# Edit with your values
notepad .env.local  # Windows
# or
nano .env.local     # Mac/Linux
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Test Webhooks Locally (Optional)

Use ngrok to test LemonSqueezy webhooks locally:

```bash
# Start ngrok
ngrok http 3000

# Update your LemonSqueezy webhook URL to the ngrok URL
```

---

## 6. Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Select your repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)

### Step 3: Add Environment Variables

In Vercel project settings, add ALL environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Your webhook secret |
| `RAZORPAY_PLAN_BASIC` | Basic plan ID |
| `RAZORPAY_PLAN_PRO` | Pro plan ID |
| `RAZORPAY_PLAN_AGENCY` | Agency plan ID |
| `GOOGLE_OAUTH_CLIENT_ID` | Google client ID |
| `GOOGLE_OAUTH_SECRET` | Google client secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `SMTP_HOST` | Your SMTP host |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your SMTP user |
| `SMTP_PASS` | Your SMTP password |
| `SMTP_FROM` | Your from email |
| `INTERNAL_API_KEY` | Random 32-char string |
| `CRON_SECRET` | Random 32-char string |

### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

### Step 5: Update Callback URLs

After deployment, update these URLs with your Vercel domain:

1. **Supabase** → Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

2. **Razorpay** → Webhooks
   - Update endpoint URL: `https://your-app.vercel.app/api/billing/webhook`

3. **Google Cloud** → Credentials → OAuth Client
   - Add redirect URI: `https://your-app.vercel.app/api/calendar/callback`

---

## 7. Post-Deployment

### Set Up Cron Job for Reminders

To send appointment reminders, set up a cron job:

**Using Vercel Cron (recommended):**

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Using External Cron Service:**

Use [cron-job.org](https://cron-job.org) or similar:
- URL: `https://your-app.vercel.app/api/cron/send-reminders`
- Schedule: Every hour
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Test the Application

1. **Sign Up**: Create a new agency account
2. **Create Client**: Add a client business
3. **Set Availability**: Configure working hours
4. **Connect Calendar**: Link Google Calendar
5. **Test Booking**: Visit `/book/client-slug` and book an appointment
6. **Test Billing**: Subscribe to a plan

### Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update all callback URLs with new domain

---

## Troubleshooting

### Build Fails

- Check all environment variables are set
- Ensure `NEXT_PUBLIC_` prefix for client-side variables

### Auth Not Working

- Verify Supabase URL Configuration
- Check redirect URLs match exactly

### Razorpay Webhooks Failing

- Verify webhook secret is correct
- Check endpoint URL is correct
- Ensure all subscription events are selected
- Check Vercel function logs for errors
- Test with Razorpay's test mode first

### Calendar Connection Fails

- Verify Google OAuth credentials
- Check redirect URIs match exactly
- Ensure Calendar API is enabled

### Emails Not Sending

- Verify SMTP credentials
- Check spam folder
- Verify domain is verified (for Resend/SendGrid)

---

## Generate Random Strings

For `INTERNAL_API_KEY` and `CRON_SECRET`, generate secure random strings:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Or use: https://generate-secret.vercel.app/32
```

---

## Quick Reference

| Service | Dashboard URL |
|---------|--------------|
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Razorpay | [dashboard.razorpay.com](https://dashboard.razorpay.com) |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Resend | [resend.com/emails](https://resend.com/emails) |

---

## Why Razorpay?

Razorpay is **India's leading payment gateway** which means:
- **Easy KYC** - Individual developers can sign up with just PAN card (no business registration)
- **Works for Indians** - Perfect for solo developers and small businesses in India
- **International cards** - Accepts Visa, Mastercard, Amex from anywhere in the world
- **Subscription support** - Built-in recurring billing with Plans and Subscriptions
- **UPI & Wallets** - Supports UPI, Paytm, PhonePe, and other Indian payment methods
- **Quick payouts** - T+2 settlement to your bank account
- **Trusted** - Powers payments for 8M+ businesses in India
- **Great documentation** - Well-documented APIs and SDKs

---

## Support

For issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check browser console for errors
4. Review Supabase logs in dashboard

---

**Last Updated**: 2025-01-28
