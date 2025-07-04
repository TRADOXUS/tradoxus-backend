-- Referral System Performance Optimization Migration
-- This migration adds compound indexes for optimal query performance

-- Drop existing indexes if they exist to avoid conflicts
DROP INDEX IF EXISTS idx_referrals_referrer_status;
DROP INDEX IF EXISTS idx_referrals_referred_status;
DROP INDEX IF EXISTS idx_referrals_status_created;
DROP INDEX IF EXISTS idx_referrals_status_completed;
DROP INDEX IF EXISTS idx_referrals_referrer_created;
DROP INDEX IF EXISTS idx_referrals_code_status;
DROP INDEX IF EXISTS idx_referrals_completed_status;
DROP INDEX IF EXISTS idx_referrals_referrer_claimed_status;
DROP INDEX IF EXISTS idx_referrals_referred_claimed_status;
DROP INDEX IF EXISTS idx_referral_codes_active_expires;
DROP INDEX IF EXISTS idx_referral_codes_active_usage;
DROP INDEX IF EXISTS idx_referral_codes_created_active;
DROP INDEX IF EXISTS idx_referral_codes_usage_analytics;

-- Compound indexes for referrals table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer_status 
ON referrals(referrer_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referred_status 
ON referrals(referred_user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_status_created 
ON referrals(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_status_completed 
ON referrals(status, completed_at DESC) 
WHERE status = 'COMPLETED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer_created 
ON referrals(referrer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_code_status 
ON referrals(referral_code_used, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_completed_status 
ON referrals(completed_at DESC, status) 
WHERE completed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer_claimed_status 
ON referrals(referrer_reward_claimed, status) 
WHERE status = 'COMPLETED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referred_claimed_status 
ON referrals(referred_reward_claimed, status) 
WHERE status = 'COMPLETED';

-- Compound indexes for referral_codes table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_active_expires 
ON referral_codes(is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_active_usage 
ON referral_codes(is_active, usage_count, max_usage) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_created_active 
ON referral_codes(created_at DESC, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_usage_analytics 
ON referral_codes(usage_count DESC, max_usage);

-- Partial indexes for common filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_pending_recent 
ON referrals(created_at DESC) 
WHERE status = 'PENDING' AND created_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_completed_recent 
ON referrals(completed_at DESC) 
WHERE status = 'COMPLETED' AND completed_at > NOW() - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_active_recent 
ON referral_codes(created_at DESC) 
WHERE is_active = true AND created_at > NOW() - INTERVAL '1 year';

-- Specialized indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_monthly_stats 
ON referrals(DATE_TRUNC('month', created_at), status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_daily_stats 
ON referrals(DATE_TRUNC('day', created_at), status) 
WHERE created_at > NOW() - INTERVAL '1 year';

-- Index for leaderboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_leaderboard 
ON referrals(referrer_id, status, completed_at) 
WHERE status = 'COMPLETED';

-- GIN indexes for JSONB metadata searching
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_metadata_gin 
ON referrals USING GIN(metadata) 
WHERE metadata IS NOT NULL;

-- Index for unclaimed rewards queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_unclaimed_rewards 
ON referrals(status, referrer_reward_claimed, referred_reward_claimed, completed_at) 
WHERE status = 'COMPLETED' AND (referrer_reward_claimed = false OR referred_reward_claimed = false);

-- Analyze tables for query optimization
ANALYZE referrals;
ANALYZE referral_codes;

-- Add comments for documentation
COMMENT ON INDEX idx_referrals_referrer_status IS 'Optimizes queries for user referrals by status';
COMMENT ON INDEX idx_referrals_referred_status IS 'Optimizes queries checking if user was referred';
COMMENT ON INDEX idx_referrals_status_created IS 'Optimizes admin dashboard status filtering with date ordering';
COMMENT ON INDEX idx_referrals_completed_status IS 'Optimizes completed referrals analytics';
COMMENT ON INDEX idx_referral_codes_active_expires IS 'Optimizes active code validation queries';
COMMENT ON INDEX idx_referral_codes_active_usage IS 'Optimizes usage limit checking for active codes';
COMMENT ON INDEX idx_referrals_leaderboard IS 'Optimizes leaderboard calculation queries';
COMMENT ON INDEX idx_referrals_unclaimed_rewards IS 'Optimizes unclaimed rewards reporting';

-- Performance tuning settings (adjust based on your database configuration)
-- These are recommendations and should be tested in your environment

-- Example configuration changes (uncomment and adjust as needed):
-- ALTER SYSTEM SET random_page_cost = 1.1; -- For SSD storage
-- ALTER SYSTEM SET effective_cache_size = '4GB'; -- Adjust based on available RAM
-- ALTER SYSTEM SET shared_buffers = '1GB'; -- Adjust based on database server RAM
-- ALTER SYSTEM SET work_mem = '256MB'; -- For complex queries and sorting
-- SELECT pg_reload_conf(); -- To apply configuration changes 