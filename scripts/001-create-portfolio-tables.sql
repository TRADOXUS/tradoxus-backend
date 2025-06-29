-- Portfolio Management Tables with Advanced Features
-- Using PostgreSQL-specific features for optimal performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Balances table with precise decimal handling
CREATE TABLE IF NOT EXISTS balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    asset VARCHAR(20) NOT NULL,
    available DECIMAL(28,8) NOT NULL DEFAULT 0,
    locked DECIMAL(28,8) NOT NULL DEFAULT 0,
    total DECIMAL(28,8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(28,8),
    unrealized_pnl DECIMAL(28,8),
    realized_pnl DECIMAL(28,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT balances_user_asset_unique UNIQUE (user_id, asset),
    CONSTRAINT balances_available_positive CHECK (available >= 0),
    CONSTRAINT balances_locked_positive CHECK (locked >= 0),
    CONSTRAINT balances_total_positive CHECK (total >= 0),
    CONSTRAINT balances_total_consistency CHECK (total = available + locked)
);

-- Transactions table with comprehensive tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'REWARD', 'FEE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    asset VARCHAR(20) NOT NULL,
    amount DECIMAL(28,8) NOT NULL,
    price DECIMAL(28,8),
    fee DECIMAL(28,8),
    total_value DECIMAL(28,8),
    tx_hash VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_price_positive CHECK (price IS NULL OR price >= 0),
    CONSTRAINT transactions_fee_positive CHECK (fee IS NULL OR fee >= 0)
);

-- Portfolio snapshots for historical tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_value DECIMAL(28,8) NOT NULL,
    total_pnl DECIMAL(28,8) NOT NULL,
    allocation JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT portfolio_snapshots_user_date_unique UNIQUE (user_id, snapshot_date),
    CONSTRAINT portfolio_snapshots_total_value_positive CHECK (total_value >= 0)
);

-- Performance indexes for optimal query speed
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_asset ON balances(asset);
CREATE INDEX IF NOT EXISTS idx_balances_user_asset ON balances(user_id, asset);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_asset ON transactions(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at) WHERE status = 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_gin ON transactions USING GIN(metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_allocation_gin ON portfolio_snapshots USING GIN(allocation);

-- Materialized view for portfolio summary (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS portfolio_summary AS
SELECT 
    b.user_id,
    COUNT(DISTINCT b.asset) as asset_count,
    SUM(b.total * COALESCE(p.price, 0)) as total_value,
    SUM(b.unrealized_pnl) as total_unrealized_pnl,
    SUM(b.realized_pnl) as total_realized_pnl,
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'asset', b.asset,
            'total', b.total,
            'value', b.total * COALESCE(p.price, 0),
            'percentage', CASE 
                WHEN SUM(b.total * COALESCE(p.price, 0)) OVER (PARTITION BY b.user_id) > 0 
                THEN (b.total * COALESCE(p.price, 0)) / SUM(b.total * COALESCE(p.price, 0)) OVER (PARTITION BY b.user_id) * 100
                ELSE 0 
            END
        ) ORDER BY b.total * COALESCE(p.price, 0) DESC
    ) as allocation
FROM balances b
LEFT JOIN (
    -- Mock price data - in production, this would be a real prices table
    VALUES 
        ('XLM', 0.12),
        ('USDC', 1.0),
        ('BTC', 45000.0),
        ('ETH', 3000.0),
        ('ADA', 0.45)
) p(asset, price) ON b.asset = p.asset
WHERE b.total > 0
GROUP BY b.user_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_summary_user_id ON portfolio_summary(user_id);

-- Function to calculate FIFO cost basis
CREATE OR REPLACE FUNCTION calculate_fifo_cost_basis(
    p_user_id UUID,
    p_asset VARCHAR(20)
) RETURNS TABLE(
    average_cost DECIMAL(28,8),
    realized_pnl DECIMAL(28,8),
    remaining_quantity DECIMAL(28,8)
) AS $$
DECLARE
    tx_record RECORD;
    buy_queue JSONB := '[]'::JSONB;
    total_realized_pnl DECIMAL(28,8) := 0;
    remaining_qty DECIMAL(28,8) := 0;
    total_cost DECIMAL(28,8) := 0;
    sell_amount DECIMAL(28,8);
    oldest_buy JSONB;
    sell_qty DECIMAL(28,8);
    sell_value DECIMAL(28,8);
    cost_basis DECIMAL(28,8);
BEGIN
    -- Process transactions in chronological order
    FOR tx_record IN 
        SELECT * FROM transactions 
        WHERE user_id = p_user_id 
        AND asset = p_asset 
        AND status = 'COMPLETED'
        ORDER BY created_at ASC
    LOOP
        IF tx_record.type IN ('BUY', 'DEPOSIT', 'TRANSFER_IN', 'REWARD') THEN
            -- Add to buy queue
            IF tx_record.price IS NOT NULL AND tx_record.price > 0 THEN
                buy_queue := buy_queue || jsonb_build_object(
                    'quantity', tx_record.amount,
                    'price', tx_record.price
                );
                total_cost := total_cost + (tx_record.amount * tx_record.price);
            END IF;
            remaining_qty := remaining_qty + tx_record.amount;
            
        ELSIF tx_record.type IN ('SELL', 'WITHDRAWAL', 'TRANSFER_OUT') THEN
            -- Process sell using FIFO
            sell_amount := tx_record.amount;
            
            WHILE sell_amount > 0 AND jsonb_array_length(buy_queue) > 0 LOOP
                oldest_buy := buy_queue -> 0;
                sell_qty := LEAST(sell_amount, (oldest_buy ->> 'quantity')::DECIMAL(28,8));
                
                IF tx_record.price IS NOT NULL AND tx_record.price > 0 THEN
                    sell_value := sell_qty * tx_record.price;
                    cost_basis := sell_qty * (oldest_buy ->> 'price')::DECIMAL(28,8);
                    total_realized_pnl := total_realized_pnl + (sell_value - cost_basis);
                END IF;
                
                -- Update buy queue
                IF (oldest_buy ->> 'quantity')::DECIMAL(28,8) = sell_qty THEN
                    buy_queue := buy_queue - 0;
                ELSE
                    buy_queue := jsonb_set(
                        buy_queue,
                        '{0,quantity}',
                        to_jsonb((oldest_buy ->> 'quantity')::DECIMAL(28,8) - sell_qty)
                    );
                END IF;
                
                sell_amount := sell_amount - sell_qty;
                total_cost := total_cost - (sell_qty * (oldest_buy ->> 'price')::DECIMAL(28,8));
            END LOOP;
            
            remaining_qty := remaining_qty - tx_record.amount;
            
        ELSIF tx_record.type = 'FEE' THEN
            remaining_qty := remaining_qty - tx_record.amount;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        CASE WHEN remaining_qty > 0 THEN total_cost / remaining_qty ELSE 0::DECIMAL(28,8) END,
        total_realized_pnl,
        remaining_qty;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update balances when transactions are completed
CREATE OR REPLACE FUNCTION update_balance_on_transaction() RETURNS TRIGGER AS $$
DECLARE
    cost_basis_result RECORD;
BEGIN
    -- Only process completed transactions
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        -- Insert or update balance
        INSERT INTO balances (user_id, asset, available, locked, total)
        VALUES (NEW.user_id, NEW.asset, 0, 0, 0)
        ON CONFLICT (user_id, asset) DO NOTHING;
        
        -- Update balance based on transaction type
        CASE NEW.type
            WHEN 'BUY', 'DEPOSIT', 'TRANSFER_IN', 'REWARD' THEN
                UPDATE balances 
                SET 
                    available = available + NEW.amount,
                    total = total + NEW.amount,
                    updated_at = NOW()
                WHERE user_id = NEW.user_id AND asset = NEW.asset;
                
            WHEN 'SELL', 'WITHDRAWAL', 'TRANSFER_OUT', 'FEE' THEN
                UPDATE balances 
                SET 
                    available = available - NEW.amount,
                    total = total - NEW.amount,
                    updated_at = NOW()
                WHERE user_id = NEW.user_id AND asset = NEW.asset;
        END CASE;
        
        -- Recalculate cost basis using FIFO
        SELECT * INTO cost_basis_result 
        FROM calculate_fifo_cost_basis(NEW.user_id, NEW.asset);
        
        UPDATE balances 
        SET 
            average_cost = cost_basis_result.average_cost,
            realized_pnl = cost_basis_result.realized_pnl,
            updated_at = NOW()
        WHERE user_id = NEW.user_id AND asset = NEW.asset;
        
        -- Refresh materialized view (non-blocking)
        REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_summary;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_balance_on_transaction ON transactions;
CREATE TRIGGER trigger_update_balance_on_transaction
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_on_transaction();

-- Function to create daily portfolio snapshots
CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE) 
RETURNS VOID AS $$
DECLARE
    snapshot_data RECORD;
BEGIN
    -- Get portfolio summary for the user
    SELECT 
        total_value,
        total_unrealized_pnl + total_realized_pnl as total_pnl,
        allocation
    INTO snapshot_data
    FROM portfolio_summary 
    WHERE user_id = p_user_id;
    
    -- Insert or update snapshot
    INSERT INTO portfolio_snapshots (user_id, snapshot_date, total_value, total_pnl, allocation)
    VALUES (p_user_id, p_date, 
            COALESCE(snapshot_data.total_value, 0), 
            COALESCE(snapshot_data.total_pnl, 0),
            COALESCE(snapshot_data.allocation, '[]'::JSONB))
    ON CONFLICT (user_id, snapshot_date) 
    DO UPDATE SET 
        total_value = EXCLUDED.total_value,
        total_pnl = EXCLUDED.total_pnl,
        allocation = EXCLUDED.allocation,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for text search on descriptions
CREATE INDEX IF NOT EXISTS idx_transactions_description_trgm ON transactions USING GIN(description gin_trgm_ops) WHERE description IS NOT NULL;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_completed_recent ON transactions(user_id, created_at DESC) 
WHERE status = 'COMPLETED' AND created_at > NOW() - INTERVAL '1 year';

CREATE INDEX IF NOT EXISTS idx_balances_active ON balances(user_id, total DESC) WHERE total > 0;

-- Comments for documentation
COMMENT ON TABLE balances IS 'User asset balances with precise decimal handling';
COMMENT ON TABLE transactions IS 'All portfolio transactions with comprehensive tracking';
COMMENT ON TABLE portfolio_snapshots IS 'Daily portfolio value snapshots for historical analysis';
COMMENT ON MATERIALIZED VIEW portfolio_summary IS 'Aggregated portfolio data for fast queries';
COMMENT ON FUNCTION calculate_fifo_cost_basis IS 'FIFO cost basis calculation for tax reporting';
COMMENT ON FUNCTION create_portfolio_snapshot IS 'Creates daily portfolio snapshots for historical tracking';
