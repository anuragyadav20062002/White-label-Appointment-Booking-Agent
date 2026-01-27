-- ============================================
-- Add reminder_sent column to appointments
-- ============================================

-- Add reminder_sent column to track if reminder email was sent
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Add index for querying appointments that need reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent
ON appointments(reminder_sent)
WHERE status = 'confirmed' AND reminder_sent = false;

-- Add additional tenant columns for email and timezone
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add full_name to users table for profile
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add slug column alias to clients (use booking_slug)
-- Note: clients table already has booking_slug, we'll add an alias/view or just use booking_slug directly
-- Adding a computed column isn't supported in PostgreSQL the same way, so we'll use a view

-- Create a view for clients with slug alias (for convenience)
CREATE OR REPLACE VIEW clients_with_slug AS
SELECT
    *,
    booking_slug as slug
FROM clients;
