# Testing Guide - White-Label Appointment Booking Agent

> This document tracks all testing requirements, test cases, and QA status.

---

## Testing Strategy

### Approach
- **Flow-based testing**: Test complete user journeys, not isolated units
- **Demo-first**: Ensure demo flows never break
- **Edge case coverage**: Identify and test failure points
- **Multi-tenant validation**: Verify data isolation

### Priority Levels
- **P0 (Critical)**: Must pass for demo/sale
- **P1 (High)**: Important for buyer confidence
- **P2 (Medium)**: Nice to have
- **P3 (Low)**: Future enhancement

---

## Test Categories

### 1. End-to-End Flows (P0)

#### Flow 1: Agency Signup & Onboarding
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1.1 | Navigate to /signup | Signup page loads | Pending |
| 1.2 | Enter valid email, password, company name | Form validates | Pending |
| 1.3 | Submit form | Account created, redirected to onboarding | Pending |
| 1.4 | Complete onboarding wizard | Tenant created, dashboard accessible | Pending |
| 1.5 | Verify email | Email verified status updated | Pending |

#### Flow 2: Client Creation
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 2.1 | Navigate to Clients page | Client list loads (empty) | Pending |
| 2.2 | Click "Add Client" | Create client form opens | Pending |
| 2.3 | Enter client details | Form validates | Pending |
| 2.4 | Submit form | Client created, appears in list | Pending |
| 2.5 | Verify unique booking slug generated | Slug is URL-safe and unique | Pending |

#### Flow 3: Calendar Connection
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 3.1 | Navigate to client settings | Settings page loads | Pending |
| 3.2 | Click "Connect Google Calendar" | Redirected to Google OAuth | Pending |
| 3.3 | Authorize access | Tokens stored securely | Pending |
| 3.4 | Return to app | Calendar status shows "Connected" | Pending |
| 3.5 | Verify token encryption | Tokens encrypted in DB | Pending |

#### Flow 4: Availability Configuration
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 4.1 | Navigate to availability settings | Settings form loads | Pending |
| 4.2 | Set working days (Mon-Fri) | Days saved | Pending |
| 4.3 | Set working hours (9AM-5PM) | Hours saved | Pending |
| 4.4 | Set appointment duration (30min) | Duration saved | Pending |
| 4.5 | Set buffer time (15min) | Buffer saved | Pending |

#### Flow 5: Public Booking (Happy Path)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 5.1 | Open /book/[slug] | Booking page loads with branding | Pending |
| 5.2 | Select date | Available slots shown | Pending |
| 5.3 | Select time slot | Slot highlighted | Pending |
| 5.4 | Enter customer details | Form validates | Pending |
| 5.5 | Submit booking | Booking created | Pending |
| 5.6 | Verify calendar event | Event created in Google Calendar | Pending |
| 5.7 | Verify confirmation email | Email sent to customer | Pending |
| 5.8 | Verify dashboard update | Appointment appears in client dashboard | Pending |

#### Flow 6: Booking Cancellation
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 6.1 | Click cancellation link in email | Cancellation page loads | Pending |
| 6.2 | Confirm cancellation | Booking status updated | Pending |
| 6.3 | Verify calendar event deleted | Event removed from calendar | Pending |
| 6.4 | Verify cancellation email | Emails sent to customer & client | Pending |

#### Flow 7: LemonSqueezy Subscription
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 7.1 | Navigate to billing page | Pricing plans shown | Pending |
| 7.2 | Select plan | LemonSqueezy checkout opens | Pending |
| 7.3 | Complete payment (test card) | Payment succeeds | Pending |
| 7.4 | Verify webhook received | Subscription created in DB | Pending |
| 7.5 | Verify plan features unlocked | Access granted correctly | Pending |

#### Flow 8: White-Label Branding
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 8.1 | Navigate to branding settings | Settings form loads | Pending |
| 8.2 | Upload logo | Logo saved to storage | Pending |
| 8.3 | Set primary color | Color saved | Pending |
| 8.4 | Set company name | Name saved | Pending |
| 8.5 | View booking page | Branding applied correctly | Pending |
| 8.6 | Receive email | Branding in email template | Pending |

---

### 2. Edge Cases (P1)

#### Double Booking Prevention
| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| DB-1 | Two users book same slot simultaneously | Only one succeeds, other gets error | Pending |
| DB-2 | Booking when calendar shows busy | Slot not available | Pending |
| DB-3 | Booking during buffer time | Slot not available | Pending |

#### Token Expiration
| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| TE-1 | Access token expires during booking | Token refreshed automatically | Pending |
| TE-2 | Refresh token revoked by user | Graceful error, reconnect prompt | Pending |
| TE-3 | Token refresh fails | Error message, no crash | Pending |

#### Timezone Handling
| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| TZ-1 | Client in EST, customer in PST | Times displayed correctly for each | Pending |
| TZ-2 | Booking across DST boundary | Correct time stored | Pending |
| TZ-3 | Calendar in different timezone | Sync handles conversion | Pending |

#### Validation
| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| V-1 | Invalid email format | Error shown | Pending |
| V-2 | Booking in the past | Error shown | Pending |
| V-3 | Booking too far in advance | Error shown | Pending |
| V-4 | Max bookings per day reached | Error shown | Pending |

---

### 3. Multi-Tenant Isolation (P0)

| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| MT-1 | Agency A queries clients | Only sees own clients | Pending |
| MT-2 | Direct DB query with wrong tenant_id | RLS blocks access | Pending |
| MT-3 | API request with forged tenant_id | Request rejected | Pending |
| MT-4 | Client A views Client B booking page | Sees correct branding for B | Pending |
| MT-5 | Staff user tries admin action | Permission denied | Pending |

---

### 4. Security Tests (P1)

| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| SEC-1 | SQL injection attempt | Query sanitized | Pending |
| SEC-2 | XSS in customer name | Output encoded | Pending |
| SEC-3 | CSRF on booking form | Token validated | Pending |
| SEC-4 | Unauthorized API access | 401/403 returned | Pending |
| SEC-5 | Webhook without valid signature | Request rejected | Pending |
| SEC-6 | Token in URL/logs | Not exposed | Pending |

---

### 5. Performance Tests (P2)

| Test | Target | Status |
|------|--------|--------|
| PERF-1 | Booking page load < 2s | Pending |
| PERF-2 | API response < 500ms | Pending |
| PERF-3 | 100 concurrent bookings | Pending |
| PERF-4 | Large client list (1000+) | Pending |

---

## Demo Script

### Pre-Demo Checklist
- [ ] Test environment has seed data
- [ ] All API keys configured
- [ ] Calendar connected and working
- [ ] At least one upcoming appointment exists
- [ ] Email sending works

### Demo Flow (5 minutes)
1. **Dashboard Overview** (30s)
   - Show agency dashboard with stats
   - Highlight client count, total bookings

2. **Client Management** (1m)
   - Create new client
   - Show booking slug generation

3. **Calendar Connection** (1m)
   - Connect Google Calendar (pre-authorized for demo)
   - Show sync status

4. **Booking Page** (1.5m)
   - Open public booking page
   - Show branding
   - Make a test booking
   - Show confirmation

5. **White-Label Branding** (1m)
   - Change logo/colors
   - Show updated booking page

---

## Test Data

### Test Accounts
```
Agency Owner:
  email: demo@agency.test
  password: Demo123!

Client Admin:
  email: client@business.test
  password: Client123!
```

### LemonSqueezy Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Google Calendar Test
```
Use Google Workspace sandbox account
Or create dedicated test Google account
```

---

## Bug Tracking

| ID | Description | Severity | Status | Fixed In |
|----|-------------|----------|--------|----------|
| - | No bugs logged yet | - | - | - |

---

## Test Execution Log

| Date | Tester | Tests Run | Passed | Failed | Notes |
|------|--------|-----------|--------|--------|-------|
| - | - | - | - | - | Testing not started |

---

## Success Criteria Validation

Before Flippa listing, ALL must pass:

| Criteria | Test IDs | Status |
|----------|----------|--------|
| Agency can onboard a client | 1.*, 2.* | Pending |
| Client can connect calendar | 3.* | Pending |
| Public booking works end-to-end | 5.* | Pending |
| LemonSqueezy subscription can be activated | 7.* | Pending |
| White-label branding is visible | 8.* | Pending |

---

**Last Updated**: Phase 1 Setup
**Next Testing Phase**: After Auth Implementation (Phase 3)
