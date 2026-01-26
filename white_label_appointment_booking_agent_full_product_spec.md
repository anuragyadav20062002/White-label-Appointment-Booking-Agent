# White‑Label Appointment Booking Agent

## 1. Product Overview (Non‑Technical)

### 1.1 What is this product?
A **white‑label appointment booking SaaS** designed primarily for **agencies and resellers**. Agencies can brand the product as their own, onboard multiple client businesses, and sell appointment booking as a recurring service.

This is NOT positioned as a Calendly competitor for end users.
It is positioned as **booking infrastructure** that agencies resell.

### 1.2 Who is the target customer?
Primary buyer / user:
- Digital marketing agencies
- Automation agencies
- IT service providers
- Local business consultants

End users (agency’s clients):
- Local service businesses (salons, consultants, clinics, coaches, real‑estate agents, etc.)

### 1.3 Core value proposition
- Agencies can launch their **own booking software** in days instead of months
- White‑label branding increases agency stickiness
- Automated bookings reduce manual coordination
- Recurring SaaS revenue opportunity for agencies

---

## 2. High‑Level App Flow (Non‑Technical)

### 2.1 Agency Flow
1. Agency signs up
2. Completes onboarding
3. Sets branding (logo, colors, domain)
4. Creates client accounts
5. Assigns calendars & staff to clients
6. Shares booking links with clients
7. Monitors appointments & usage

### 2.2 Client Business Flow
1. Client receives access from agency
2. Connects calendar
3. Sets availability rules
4. Shares booking page link
5. Receives bookings automatically

### 2.3 End Customer Flow (Booking a slot)
1. Opens booking page
2. Selects available time slot
3. Enters name + email (+ optional phone)
4. Confirms booking
5. Receives confirmation & reminder emails

---

## 3. User Roles & Permissions

### 3.1 Roles
- **Agency Owner** (top‑level account)
- **Client Admin** (business owner)
- **Staff User** (optional)

### 3.2 Permissions

| Feature | Agency Owner | Client Admin | Staff |
|------|-------------|-------------|-------|
| Create clients | ✅ | ❌ | ❌ |
| White‑label branding | ✅ | ❌ | ❌ |
| Connect calendar | ❌ | ✅ | ❌ |
| Manage availability | ❌ | ✅ | ❌ |
| View appointments | ✅ | ✅ | ✅ |
| Cancel appointments | ❌ | ✅ | ❌ |

---

## 4. Functional Requirements (Detailed)

### 4.1 Authentication & Accounts
- Email + password authentication
- Email verification required
- Password reset functionality
- Session‑based authentication

### 4.2 Multi‑Tenant Architecture
- Each agency is a **tenant**
- Each tenant can create multiple **clients**
- Each client is isolated (data separation)

### 4.3 White‑Label Branding
Agency‑level branding:
- Logo upload
- Primary & secondary colors
- Company name
- Custom booking page domain (CNAME support)

Branding applies to:
- Booking pages
- Email templates
- Dashboard UI

### 4.4 Booking Page
- Publicly accessible booking URL per client
- Displays availability from connected calendar
- Supports buffer time between appointments
- Allows cancellation & rescheduling via secure link

Booking form fields:
- Name (required)
- Email (required)
- Phone (optional)

### 4.5 Calendar Integration
Minimum viable:
- Google Calendar (OAuth)

Capabilities:
- Read availability
- Create calendar events
- Prevent double booking
- Handle timezone differences

### 4.6 Availability Rules
Client can configure:
- Working days
- Daily working hours
- Appointment duration
- Buffer time
- Maximum bookings per day

### 4.7 Email Notifications
System‑generated emails:
- Booking confirmation
- Reminder (24 hours before)
- Cancellation notification

Email requirements:
- White‑label sender name
- Agency branding
- Editable templates

### 4.8 Admin Dashboard

Agency Dashboard:
- List of clients
- Subscription status
- Total bookings (aggregate)

Client Dashboard:
- Upcoming appointments
- Calendar connection status
- Availability settings

### 4.9 Subscription & Billing
- Stripe subscription billing
- Free trial support
- Monthly recurring plans

Suggested plans:
- Basic
- Pro
- Agency / White‑Label

Stripe features:
- Webhooks
- Subscription lifecycle handling
- Payment failure handling

---

## 5. Non‑Functional Requirements

### 5.1 Performance
- Booking page loads < 2 seconds
- API response time < 500ms (average)

### 5.2 Security
- Secure OAuth token storage
- Encrypted sensitive fields
- Role‑based access checks

### 5.3 Scalability
- Designed for multi‑tenant usage
- Horizontal scalability via serverless APIs

### 5.4 Maintainability
- Modular code structure
- Clear separation of concerns
- Environment‑based configs

---

## 6. Technical Architecture

### 6.1 Frontend
- Framework: Next.js (React)
- Styling: Tailwind CSS
- Deployment: Vercel

### 6.2 Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Edge Functions or Node.js APIs

### 6.3 Database (Core Tables)

#### users
- id (uuid)
- email
- password_hash
- role
- tenant_id

#### tenants (agencies)
- id
- name
- branding_config

#### clients
- id
- tenant_id
- name
- booking_slug

#### calendar_accounts
- id
- client_id
- provider
- refresh_token

#### appointments
- id
- client_id
- start_time
- end_time
- customer_email
- status

#### subscriptions
- id
- tenant_id
- stripe_subscription_id
- plan

---

## 7. API Endpoints (Conceptual)

### Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/logout

### Calendar
- GET /calendar/connect
- GET /calendar/callback

### Booking
- POST /bookings
- GET /bookings
- PATCH /bookings/:id

### Admin
- GET /clients
- POST /clients
- PATCH /clients/:id

### Billing
- POST /billing/create‑checkout
- POST /billing/webhook

---

## 8. Deployment & Environment

### Required Environment Variables
- SUPABASE_URL
- SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_SECRET
- EMAIL_SMTP_KEYS

### Deployment Steps
1. Deploy frontend to Vercel
2. Setup Supabase project
3. Configure Stripe products
4. Setup Google OAuth
5. Verify domain & DNS

---

## 9. Handover & Buyer Readiness (Important)

Deliverables:
- Full source code
- Setup documentation
- API key checklist
- Demo credentials
- Architecture overview

This ensures the product is **Flippa‑ready** and transferable.

---

## 10. Product Boundaries (What NOT to Build)

Explicitly out of scope:
- AI chatbots
- WhatsApp automation
- CRM
- Payment collection from customers
- Mobile apps

These are future extensions, not MVP scope.

---

## 11. Success Criteria

The product is considered complete when:
- An agency can onboard a client
- Client can connect calendar
- Public booking works end‑to‑end
- Stripe subscription can be activated
- White‑label branding is visible

---

## 12. One‑Line Product Definition (For Context)

"A white‑label, multi‑tenant appointment booking infrastructure that agencies can brand, resell, and monetize."

