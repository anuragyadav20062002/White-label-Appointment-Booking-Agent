# Project Tasks - White-Label Appointment Booking Agent

## Phase 1: Project Foundation
**Goal**: Set up the development environment and core project structure

### 1.1 Project Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Create folder structure (app, components, lib, types, hooks)
- [ ] Configure environment variables template (.env.example)
- [ ] Set up Git hooks (husky for pre-commit)

### 1.2 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure Supabase client in Next.js
- [ ] Set up Supabase Auth
- [ ] Create database connection utilities

### 1.3 Type Definitions
- [ ] Define TypeScript types for all entities
- [ ] Create shared types for API responses
- [ ] Define enums for roles, statuses, etc.

---

## Phase 2: Database Design & Implementation
**Goal**: Create the multi-tenant database schema

### 2.1 Core Tables
- [ ] Create `tenants` table (agencies)
- [ ] Create `users` table with tenant relationship
- [ ] Create `clients` table
- [ ] Create `calendar_accounts` table
- [ ] Create `appointments` table
- [ ] Create `subscriptions` table
- [ ] Create `availability_rules` table

### 2.2 Security Policies
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Create tenant isolation policies
- [ ] Create role-based access policies
- [ ] Test cross-tenant access prevention

### 2.3 Database Utilities
- [ ] Create migration scripts
- [ ] Create seed data for development
- [ ] Document schema in ARCHITECTURE.md

---

## Phase 3: Authentication System
**Goal**: Implement secure multi-tenant authentication

### 3.1 Auth Pages
- [ ] Create signup page (agency registration)
- [ ] Create login page
- [ ] Create password reset flow
- [ ] Create email verification flow

### 3.2 Auth API Routes
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] POST /api/auth/reset-password
- [ ] POST /api/auth/verify-email

### 3.3 Session Management
- [ ] Configure Supabase Auth session handling
- [ ] Create auth context/provider
- [ ] Implement protected route middleware
- [ ] Create auth hooks (useUser, useSession)

### 3.4 Role-Based Access
- [ ] Implement RBAC utilities
- [ ] Create permission checking functions
- [ ] Add role guards to API routes

---

## Phase 4: Multi-Tenant Core
**Goal**: Implement tenant (agency) management

### 4.1 Agency Onboarding
- [ ] Create onboarding wizard UI
- [ ] Implement agency profile setup
- [ ] Create tenant record on signup

### 4.2 Branding System
- [ ] Create branding settings UI
- [ ] Implement logo upload (Supabase Storage)
- [ ] Implement color scheme configuration
- [ ] Store branding config in tenant record

### 4.3 Agency Dashboard
- [ ] Create agency dashboard layout
- [ ] Implement client list view
- [ ] Add aggregate statistics (total bookings)
- [ ] Show subscription status

---

## Phase 5: Client Management
**Goal**: Enable agencies to create and manage clients

### 5.1 Client CRUD
- [ ] Create client creation form
- [ ] Implement client list view
- [ ] Implement client edit functionality
- [ ] Implement client deletion/deactivation

### 5.2 Client API Routes
- [ ] GET /api/clients
- [ ] POST /api/clients
- [ ] GET /api/clients/[id]
- [ ] PATCH /api/clients/[id]
- [ ] DELETE /api/clients/[id]

### 5.3 Client Dashboard
- [ ] Create client dashboard layout
- [ ] Show upcoming appointments
- [ ] Display calendar connection status
- [ ] Link to availability settings

---

## Phase 6: Google Calendar Integration
**Goal**: Implement OAuth and calendar sync

### 6.1 OAuth Flow
- [ ] Set up Google Cloud project
- [ ] Implement OAuth authorization endpoint
- [ ] Implement OAuth callback handler
- [ ] Store tokens securely (encrypted)

### 6.2 Calendar API Routes
- [ ] GET /api/calendar/connect
- [ ] GET /api/calendar/callback
- [ ] GET /api/calendar/status
- [ ] POST /api/calendar/disconnect

### 6.3 Calendar Operations
- [ ] Implement free/busy query
- [ ] Implement event creation
- [ ] Implement event deletion
- [ ] Handle timezone conversions

### 6.4 Token Management
- [ ] Implement token refresh logic
- [ ] Handle token expiration gracefully
- [ ] Create token encryption/decryption utilities

---

## Phase 7: Availability System
**Goal**: Allow clients to configure booking availability

### 7.1 Availability Settings UI
- [ ] Create working days selector
- [ ] Create working hours configuration
- [ ] Implement appointment duration setting
- [ ] Implement buffer time setting
- [ ] Implement max bookings per day

### 7.2 Availability API
- [ ] GET /api/availability
- [ ] POST /api/availability
- [ ] PATCH /api/availability
- [ ] GET /api/availability/slots (public)

### 7.3 Slot Calculation
- [ ] Create slot generation algorithm
- [ ] Merge with Google Calendar availability
- [ ] Apply buffer time logic
- [ ] Respect max bookings limit

---

## Phase 8: Booking System
**Goal**: Implement the core booking functionality

### 8.1 Public Booking Page
- [ ] Create dynamic booking page route ([slug])
- [ ] Implement date picker component
- [ ] Implement time slot selector
- [ ] Create booking form (name, email, phone)
- [ ] Apply agency branding to page
- [ ] Create confirmation screen

### 8.2 Booking API Routes
- [ ] POST /api/bookings (create)
- [ ] GET /api/bookings (list)
- [ ] GET /api/bookings/[id] (detail)
- [ ] PATCH /api/bookings/[id] (cancel/reschedule)

### 8.3 Booking Logic
- [ ] Implement double-booking prevention
- [ ] Create calendar event on booking
- [ ] Generate secure cancel/reschedule links
- [ ] Handle concurrent booking attempts

### 8.4 Booking Management
- [ ] Create appointments list view
- [ ] Implement appointment detail modal
- [ ] Add cancellation functionality
- [ ] Create reschedule flow

---

## Phase 9: Email Notifications
**Goal**: Implement transactional email system

### 9.1 Email Infrastructure
- [ ] Configure SMTP provider
- [ ] Create email sending utility
- [ ] Set up email templates folder

### 9.2 Email Templates
- [ ] Booking confirmation template
- [ ] Reminder email template (24h before)
- [ ] Cancellation notification template
- [ ] Apply white-label branding to templates

### 9.3 Email Triggers
- [ ] Send confirmation on booking
- [ ] Schedule reminder email
- [ ] Send cancellation notification
- [ ] Handle email failures gracefully

---

## Phase 10: Stripe Subscription Billing
**Goal**: Implement subscription management

### 10.1 Stripe Setup
- [ ] Create Stripe products and prices
- [ ] Configure Stripe webhook endpoint
- [ ] Implement webhook signature verification

### 10.2 Billing API Routes
- [ ] POST /api/billing/create-checkout
- [ ] POST /api/billing/webhook
- [ ] GET /api/billing/portal (customer portal)
- [ ] GET /api/billing/status

### 10.3 Subscription Management
- [ ] Handle checkout.session.completed
- [ ] Handle subscription.updated
- [ ] Handle subscription.deleted
- [ ] Handle invoice.payment_failed
- [ ] Sync subscription status to database

### 10.4 Billing UI
- [ ] Create pricing page
- [ ] Create billing settings page
- [ ] Show current plan and usage
- [ ] Add upgrade/downgrade options

---

## Phase 11: White-Label Features
**Goal**: Complete white-label branding system

### 11.1 Custom Domain Support
- [ ] Document CNAME setup instructions
- [ ] Handle custom domain detection
- [ ] Serve correct branding per domain

### 11.2 Branding Application
- [ ] Apply branding to all email templates
- [ ] Apply branding to booking pages
- [ ] Apply branding to dashboard UI
- [ ] Create branding preview feature

---

## Phase 12: Testing & QA
**Goal**: Ensure product reliability

### 12.1 End-to-End Testing
- [ ] Test agency signup flow
- [ ] Test client creation flow
- [ ] Test calendar connection flow
- [ ] Test complete booking flow
- [ ] Test subscription flow

### 12.2 Edge Case Testing
- [ ] Test double booking prevention
- [ ] Test token expiration handling
- [ ] Test timezone edge cases
- [ ] Test multi-tenant isolation

### 12.3 Demo Environment
- [ ] Create seed data script
- [ ] Prepare demo credentials
- [ ] Verify demo flows work reliably

---

## Phase 13: Documentation & Handover
**Goal**: Prepare for Flippa-ready sale

### 13.1 Technical Documentation
- [ ] Complete README.md
- [ ] Write SETUP.md
- [ ] Create ARCHITECTURE.md
- [ ] Document API endpoints

### 13.2 Buyer Documentation
- [ ] Create HANDOVER.md
- [ ] Document all required API keys
- [ ] Create account transfer checklist
- [ ] Write troubleshooting guide

### 13.3 Asset Packaging
- [ ] Clean up codebase
- [ ] Remove development artifacts
- [ ] Create .env.example with all variables
- [ ] Prepare database export scripts

---

## Phase 14: Final Polish & Launch
**Goal**: Production-ready deployment

### 14.1 Performance Optimization
- [ ] Optimize booking page load time
- [ ] Add loading states
- [ ] Implement error boundaries

### 14.2 Security Audit
- [ ] Review all API endpoints
- [ ] Verify RLS policies
- [ ] Check for exposed secrets
- [ ] Test RBAC enforcement

### 14.3 Production Deployment
- [ ] Deploy to Vercel
- [ ] Configure production Supabase
- [ ] Set up production Stripe
- [ ] Configure production domain

### 14.4 Success Criteria Validation
- [ ] Agency can onboard a client
- [ ] Client can connect calendar
- [ ] Public booking works end-to-end
- [ ] Stripe subscription can be activated
- [ ] White-label branding is visible

---

## Task Priority Legend
- **Critical**: Must complete for MVP
- **High**: Important for buyer confidence
- **Medium**: Nice to have for launch
- **Low**: Future enhancement

## Dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2
- Phase 4-5 depend on Phase 3
- Phase 6-7 can run parallel after Phase 5
- Phase 8 depends on Phase 6-7
- Phase 9 depends on Phase 8
- Phase 10 can run parallel with Phase 8-9
- Phase 11-14 depend on all previous phases
