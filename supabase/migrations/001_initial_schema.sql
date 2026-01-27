-- ============================================
-- WHITE-LABEL APPOINTMENT BOOKING AGENT
-- Initial Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

CREATE TYPE user_role AS ENUM ('agency_owner', 'client_admin', 'staff');
CREATE TYPE appointment_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'agency');
CREATE TYPE calendar_provider AS ENUM ('google');

-- ============================================
-- TABLES
-- ============================================

-- Tenants (Agencies)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    branding_config JSONB DEFAULT '{
        "primary_color": "#2563eb",
        "secondary_color": "#1e40af",
        "company_name": ""
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'agency_owner',
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, tenant_id)
);

-- Clients (Businesses under each tenant)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    booking_slug VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Settings
CREATE TABLE client_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
    appointment_duration INTEGER DEFAULT 30, -- minutes
    buffer_time INTEGER DEFAULT 15, -- minutes
    max_bookings_per_day INTEGER DEFAULT 10,
    min_notice_hours INTEGER DEFAULT 24, -- minimum hours before booking
    max_advance_days INTEGER DEFAULT 30, -- maximum days in advance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Accounts
CREATE TABLE calendar_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    calendar_id VARCHAR(255),
    is_connected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, provider)
);

-- Availability Rules
CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, day_of_week),
    CHECK (end_time > start_time)
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    status appointment_status DEFAULT 'confirmed',
    calendar_event_id VARCHAR(255),
    notes TEXT,
    cancellation_token VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan subscription_plan NOT NULL DEFAULT 'basic',
    status subscription_status NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_booking_slug ON clients(booking_slug);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_customer_email ON appointments(customer_email);
CREATE INDEX idx_availability_rules_client_id ON availability_rules(client_id);
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Get tenant_id for current user
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Check if user is agency owner
CREATE OR REPLACE FUNCTION is_agency_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'agency_owner' FROM users WHERE id = auth.uid());
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Generate unique booking slug
CREATE OR REPLACE FUNCTION generate_booking_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Truncate to max 50 chars
    base_slug := left(base_slug, 50);

    final_slug := base_slug;

    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM clients WHERE booking_slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_settings_updated_at
    BEFORE UPDATE ON client_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_accounts_updated_at
    BEFORE UPDATE ON calendar_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at
    BEFORE UPDATE ON availability_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- TENANTS: Users can only see their own tenant
CREATE POLICY "Users can view own tenant"
    ON tenants FOR SELECT
    USING (id = get_user_tenant_id());

CREATE POLICY "Agency owners can update own tenant"
    ON tenants FOR UPDATE
    USING (id = get_user_tenant_id() AND is_agency_owner());

-- USERS: Users can see users in their tenant
CREATE POLICY "Users can view users in own tenant"
    ON users FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Agency owners can manage users"
    ON users FOR ALL
    USING (tenant_id = get_user_tenant_id() AND is_agency_owner());

-- CLIENTS: Tenant isolation
CREATE POLICY "Users can view clients in own tenant"
    ON clients FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Agency owners can manage clients"
    ON clients FOR ALL
    USING (tenant_id = get_user_tenant_id() AND is_agency_owner());

-- PUBLIC: Anyone can view client by booking_slug (for booking page)
CREATE POLICY "Public can view active clients by slug"
    ON clients FOR SELECT
    USING (is_active = TRUE);

-- CLIENT SETTINGS: Tenant isolation
CREATE POLICY "Users can view client settings in own tenant"
    ON client_settings FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
    );

CREATE POLICY "Agency owners can manage client settings"
    ON client_settings FOR ALL
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
        AND is_agency_owner()
    );

-- PUBLIC: Anyone can view settings for booking
CREATE POLICY "Public can view client settings"
    ON client_settings FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE is_active = TRUE)
    );

-- CALENDAR ACCOUNTS: Tenant isolation (sensitive data)
CREATE POLICY "Users can view calendar accounts in own tenant"
    ON calendar_accounts FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
    );

CREATE POLICY "Agency owners can manage calendar accounts"
    ON calendar_accounts FOR ALL
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
        AND is_agency_owner()
    );

-- AVAILABILITY RULES: Tenant isolation + public read
CREATE POLICY "Users can view availability in own tenant"
    ON availability_rules FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
    );

CREATE POLICY "Agency owners can manage availability"
    ON availability_rules FOR ALL
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
        AND is_agency_owner()
    );

CREATE POLICY "Public can view availability for booking"
    ON availability_rules FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE is_active = TRUE)
    );

-- APPOINTMENTS: Tenant isolation + public create
CREATE POLICY "Users can view appointments in own tenant"
    ON appointments FOR SELECT
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
    );

CREATE POLICY "Users can manage appointments in own tenant"
    ON appointments FOR ALL
    USING (
        client_id IN (SELECT id FROM clients WHERE tenant_id = get_user_tenant_id())
    );

-- Public can create appointments (booking)
CREATE POLICY "Public can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (
        client_id IN (SELECT id FROM clients WHERE is_active = TRUE)
    );

-- Public can view/cancel own appointments via token
CREATE POLICY "Public can view own appointments"
    ON appointments FOR SELECT
    USING (TRUE); -- Filtered by cancellation_token in app logic

CREATE POLICY "Public can cancel own appointments"
    ON appointments FOR UPDATE
    USING (TRUE) -- Filtered by cancellation_token in app logic
    WITH CHECK (status = 'cancelled');

-- SUBSCRIPTIONS: Tenant isolation
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Agency owners can view subscription"
    ON subscriptions FOR ALL
    USING (tenant_id = get_user_tenant_id() AND is_agency_owner());

-- ============================================
-- SERVICE ROLE BYPASS (for webhooks, admin)
-- ============================================

-- These policies allow the service role to bypass RLS
-- Service role is used for Stripe webhooks, admin operations, etc.

-- Note: Service role automatically bypasses RLS in Supabase
-- No additional policies needed

-- ============================================
-- INITIAL DATA FUNCTIONS
-- ============================================

-- Function to create default availability rules for a client
CREATE OR REPLACE FUNCTION create_default_availability(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Monday to Friday, 9 AM to 5 PM
    INSERT INTO availability_rules (client_id, day_of_week, start_time, end_time, is_available)
    VALUES
        (p_client_id, 0, '09:00', '17:00', TRUE), -- Monday
        (p_client_id, 1, '09:00', '17:00', TRUE), -- Tuesday
        (p_client_id, 2, '09:00', '17:00', TRUE), -- Wednesday
        (p_client_id, 3, '09:00', '17:00', TRUE), -- Thursday
        (p_client_id, 4, '09:00', '17:00', TRUE), -- Friday
        (p_client_id, 5, '09:00', '17:00', FALSE), -- Saturday
        (p_client_id, 6, '09:00', '17:00', FALSE); -- Sunday
END;
$$ language 'plpgsql';

-- Function to create default settings for a client
CREATE OR REPLACE FUNCTION create_default_client_settings(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO client_settings (client_id)
    VALUES (p_client_id);
END;
$$ language 'plpgsql';

-- Trigger to auto-create defaults when a client is created
CREATE OR REPLACE FUNCTION on_client_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_availability(NEW.id);
    PERFORM create_default_client_settings(NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_client_created
    AFTER INSERT ON clients
    FOR EACH ROW EXECUTE FUNCTION on_client_created();
