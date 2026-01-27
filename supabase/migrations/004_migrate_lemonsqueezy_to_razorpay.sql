-- ============================================
-- MIGRATION: LemonSqueezy to Razorpay
-- This migration renames payment provider columns
-- ============================================

-- Step 1: Rename columns in subscriptions table
ALTER TABLE subscriptions
  RENAME COLUMN lemonsqueezy_subscription_id TO razorpay_subscription_id;

ALTER TABLE subscriptions
  RENAME COLUMN lemonsqueezy_customer_id TO razorpay_customer_id;

-- Step 2: Update indexes (drop old, create new)
DROP INDEX IF EXISTS idx_subscriptions_lemonsqueezy_id;
CREATE INDEX idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

-- Step 3: Update any existing trial subscriptions to match new naming convention
-- (trial subscriptions have IDs like 'trial_<tenant_id>')
-- No changes needed as the prefix remains the same

-- Step 4: Add comment to document the migration
COMMENT ON COLUMN subscriptions.razorpay_subscription_id IS 'Razorpay subscription ID (migrated from LemonSqueezy)';
COMMENT ON COLUMN subscriptions.razorpay_customer_id IS 'Razorpay customer ID (migrated from LemonSqueezy)';
