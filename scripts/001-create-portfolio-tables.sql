-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    asset VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT')),
    amount DECIMAL(20,7) NOT NULL,
    price DECIMAL(20,7),
    fee DECIMAL(20,7),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    "txHash" VARCHAR(255),
    metadata TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    asset VARCHAR(20) NOT NULL,
    available DECIMAL(20,7) DEFAULT 0,
    locked DECIMAL(20,7) DEFAULT 0,
    "averageCost" DECIMAL(20,7) DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE("userId", asset)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions("userId", status);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_created ON transactions(asset, "createdAt");
CREATE INDEX IF NOT EXISTS idx_transactions_user_asset_status ON transactions("userId", asset, status);
CREATE INDEX IF NOT EXISTS idx_balances_user ON balances("userId");
CREATE INDEX IF NOT EXISTS idx_balances_asset ON balances(asset);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at 
    BEFORE UPDATE ON balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
