-- ============================================
-- SEED DATA FOR DEMO/DEVELOPMENT
-- Run this after creating a test user in Supabase Auth
-- ============================================

-- Note: Replace 'YOUR_AUTH_USER_ID' with actual auth.users id after signup

-- Demo Tenant (Agency)
INSERT INTO tenants (id, name, branding_config)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Agency',
    '{
        "logo_url": null,
        "primary_color": "#2563eb",
        "secondary_color": "#1e40af",
        "company_name": "Demo Agency"
    }'::jsonb
);

-- Demo User (Agency Owner) - Update this ID after creating user in Supabase Auth
-- INSERT INTO users (id, email, role, tenant_id, first_name, last_name, email_verified)
-- VALUES (
--     'YOUR_AUTH_USER_ID',
--     'demo@agency.test',
--     'agency_owner',
--     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
--     'Demo',
--     'Owner',
--     TRUE
-- );

-- Demo Clients
INSERT INTO clients (id, tenant_id, name, booking_slug, email, phone, timezone)
VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Acme Consulting',
        'acme-consulting',
        'contact@acme.test',
        '+1-555-0100',
        'America/New_York'
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Best Salon',
        'best-salon',
        'hello@bestsalon.test',
        '+1-555-0200',
        'America/Los_Angeles'
    );

-- Note: Availability rules and client settings are auto-created by trigger

-- Demo Appointments
INSERT INTO appointments (client_id, start_time, end_time, customer_name, customer_email, customer_phone, status)
VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
        NOW() + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes',
        'John Smith',
        'john@example.com',
        '+1-555-1234',
        'confirmed'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() + INTERVAL '2 days' + INTERVAL '14 hours',
        NOW() + INTERVAL '2 days' + INTERVAL '14 hours 30 minutes',
        'Jane Doe',
        'jane@example.com',
        '+1-555-5678',
        'confirmed'
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
        NOW() + INTERVAL '1 day' + INTERVAL '11 hours 30 minutes',
        'Alice Johnson',
        'alice@example.com',
        NULL,
        'confirmed'
    );

-- Demo Subscription (Active trial)
INSERT INTO subscriptions (tenant_id, lemonsqueezy_subscription_id, lemonsqueezy_customer_id, plan, status, current_period_start, current_period_end)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'sub_demo_123',
    'cus_demo_456',
    'agency',
    'trialing',
    NOW(),
    NOW() + INTERVAL '14 days'
);
