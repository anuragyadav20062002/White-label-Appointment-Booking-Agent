# White-Label Appointment Booking Agent

> AI Assistant Context File - Contains essential information about the application

---

## Product Definition

**One-Line Summary**: A white-label, multi-tenant appointment booking infrastructure that agencies can brand, resell, and monetize.

**Product Type**: B2B SaaS for agencies and resellers (NOT a Calendly competitor for end users)

---

## Target Customers

### Primary Buyers
- Digital marketing agencies
- Automation agencies
- IT service providers
- Local business consultants

### End Users (Agency Clients)
- Local service businesses
- Salons
- Consultants
- Clinics
- Coaches
- Real estate agents

---

## Core Value Proposition

1. Agencies can launch their **own booking software** in days
2. White-label branding increases agency stickiness
3. Automated bookings reduce manual coordination
4. Recurring SaaS revenue opportunity for agencies

---

## User Roles & Permissions

### Roles
| Role | Description |
|------|-------------|
| Agency Owner | Top-level account, manages tenants |
| Client Admin | Business owner, manages their booking |
| Staff User | View-only access to appointments |

### Permissions Matrix
| Feature | Agency Owner | Client Admin | Staff |
|---------|-------------|--------------|-------|
| Create clients | Yes | No | No |
| White-label branding | Yes | No | No |
| Connect calendar | No | Yes | No |
| Manage availability | No | Yes | No |
| View appointments | Yes | Yes | Yes |
| Cancel appointments | No | Yes | No |

---

## Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **APIs**: Edge Functions / Node.js

### External Services
- **Payments**: Razorpay (Indian Payment Gateway)
- **Calendar**: Google Calendar (OAuth)
- **Email**: SMTP provider

---

## Database Schema

### Core Tables
```
tenants         - Agencies (multi-tenant root)
users           - All users with role and tenant_id
clients         - Businesses under each tenant
calendar_accounts - Google OAuth tokens
appointments    - Booked appointments
subscriptions   - Razorpay subscription data
availability_rules - Client booking rules
```

### Key Relationships
- `users.tenant_id` → `tenants.id`
- `clients.tenant_id` → `tenants.id`
- `calendar_accounts.client_id` → `clients.id`
- `appointments.client_id` → `clients.id`
- `subscriptions.tenant_id` → `tenants.id`

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register agency
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Password reset

### Calendar
- `GET /api/calendar/connect` - Initiate OAuth
- `GET /api/calendar/callback` - OAuth callback

### Bookings
- `GET /api/bookings` - List appointments
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/[id]` - Update/cancel

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PATCH /api/clients/[id]` - Update client

### Billing
- `POST /api/billing/create-checkout` - Start checkout
- `POST /api/billing/webhook` - Razorpay webhooks
- `POST /api/billing/portal` - Customer portal

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay (Payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_BASIC=
RAZORPAY_PLAN_PRO=
RAZORPAY_PLAN_AGENCY=

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Key Features

### White-Label Branding
- Logo upload
- Primary & secondary colors
- Company name
- Custom booking page domain (CNAME)
- Branded email templates

### Booking Page
- Public URL per client
- Displays calendar availability
- Buffer time between appointments
- Cancellation & rescheduling links

### Availability Rules
- Working days selection
- Daily working hours
- Appointment duration
- Buffer time
- Max bookings per day

### Email Notifications
- Booking confirmation
- 24-hour reminder
- Cancellation notification

### Subscription Plans
- Basic
- Pro
- Agency / White-Label

---

## Product Boundaries (Out of Scope)

**DO NOT BUILD**:
- AI chatbots
- WhatsApp automation
- CRM functionality
- Payment collection from customers
- Mobile apps

These are future extensions, not MVP scope.

---

## Success Criteria

The product is complete when:
1. An agency can onboard a client
2. Client can connect their calendar
3. Public booking works end-to-end
4. Razorpay subscription can be activated
5. White-label branding is visible

---

## Non-Functional Requirements

### Performance
- Booking page loads < 2 seconds
- API response time < 500ms average

### Security
- Secure OAuth token storage (encrypted)
- Role-based access control
- Tenant data isolation (RLS)

### Scalability
- Multi-tenant architecture
- Serverless API design

---

## File Structure (Recommended)

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Protected dashboard
│   ├── api/               # API routes
│   └── book/[slug]/       # Public booking pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   ├── razorpay/         # Razorpay utilities
│   ├── calendar/         # Google Calendar
│   └── email/            # Email utilities
├── types/                 # TypeScript types
├── hooks/                 # React hooks
└── styles/               # Global styles
```

---

## Development Guidelines

1. **Scope Discipline**: Follow spec strictly, no feature creep
2. **Simplicity**: Prefer boring, proven solutions
3. **Tenant Isolation**: Every query must be tenant-scoped
4. **Buyer-Ready**: Code should be clean and documented
5. **Demo-Ready**: UI should screenshot well

---

## Handover Deliverables

- [ ] Full source code
- [ ] Setup documentation
- [ ] API key checklist
- [ ] Demo credentials
- [ ] Architecture overview
- [ ] Database migration scripts
- [ ] Environment variable template

---

## Quick Reference

| Item | Value |
|------|-------|
| Framework | Next.js 14+ |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Payments | Razorpay |
| Calendar | Google Calendar API |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Agent Handoff Protocol (CRITICAL)

> This project uses multiple AI agents (Claude, OpenAI Codex, Cursor). Follow this protocol to maintain continuity.

### CONTEXT_HANDOFF.md is the Source of Truth

**ALWAYS read `CONTEXT_HANDOFF.md` FIRST** - it contains:
- Current project state
- What was just completed
- What to do next
- Active blockers
- Session history

### Before Starting Any Work
```
1. Read CONTEXT_HANDOFF.md
2. Check "Quick Status" for current phase/task
3. Read "What To Do Next" for immediate actions
4. Check "Active Problems / Blockers"
5. Begin work
```

### After Completing Work (MANDATORY)
```
1. Update CONTEXT_HANDOFF.md:
   - Update "Quick Status" table
   - Update "What Was Just Done"
   - Update "What To Do Next"
   - Update "Current File State" if files changed
   - Add entry to "Session Notes"
2. Update COMPLETION_STATUS.md if tasks completed
3. Commit changes with descriptive message
```

### Emergency Context Recovery
If you have no idea what's happening:
1. Read `white_label_appointment_booking_agent_full_product_spec.md` (full spec)
2. Read `CLAUDE.md` (this file - app context)
3. Read `CONTEXT_HANDOFF.md` (current state)
4. Read `COMPLETION_STATUS.md` (what's done)
5. Continue from "What To Do Next" in CONTEXT_HANDOFF.md

### File Priority Order
| Priority | File | Purpose |
|----------|------|---------|
| 1 | CONTEXT_HANDOFF.md | Current state, next steps |
| 2 | COMPLETION_STATUS.md | Progress tracking |
| 3 | TASKS.md | All tasks by phase |
| 4 | CLAUDE.md | Full app context |
| 5 | Product spec | Original requirements |
