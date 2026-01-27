-- ============================================
-- MIGRATION: Stripe to LemonSqueezy
-- ============================================
-- This migration renames Stripe columns to LemonSqueezy columns
-- Run this ONLY if you have existing data with Stripe columns

-- Step 1: Rename columns in subscriptions table
ALTER TABLE subscriptions
  RENAME COLUMN stripe_subscription_id TO lemonsqueezy_subscription_id;

ALTER TABLE subscriptions
  RENAME COLUMN stripe_customer_id TO lemonsqueezy_customer_id;

-- Step 2: Update index name (optional, for clarity)
DROP INDEX IF EXISTS idx_subscriptions_stripe_id;
CREATE INDEX idx_subscriptions_lemonsqueezy_id ON subscriptions(lemonsqueezy_subscription_id);

-- Note: If you're setting up a fresh database, use the updated 001_initial_schema.sql instead
-- This migration is only for existing databases that were using Stripe
