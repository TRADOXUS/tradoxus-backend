-- Insert sample transactions for testing
INSERT INTO transactions (id, "userId", asset, type, amount, price, fee, status, "txHash", "createdAt") VALUES
-- User 1 transactions
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users LIMIT 1), 'XLM', 'DEPOSIT', '10000.0000000', NULL, '0.0000000', 'COMPLETED', 'deposit_hash_1', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM users LIMIT 1), 'XLM', 'BUY', '5000.0000000', '0.1200000', '6.0000000', 'COMPLETED', 'buy_hash_1', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM users LIMIT 1), 'USDC', 'DEPOSIT', '1000.0000000', NULL, '0.0000000', 'COMPLETED', 'deposit_hash_2', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM users LIMIT 1), 'XLM', 'SELL', '2000.0000000', '0.1300000', '2.6000000', 'COMPLETED', 'sell_hash_1', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM users LIMIT 1), 'BTC', 'BUY', '0.0100000', '45000.0000000', '4.5000000', 'COMPLETED', 'buy_hash_2', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM users LIMIT 1), 'XLM', 'BUY', '1000.0000000', '0.1150000', '1.1500000', 'COMPLETED', 'buy_hash_3', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM users LIMIT 1), 'USDC', 'WITHDRAWAL', '200.0000000', NULL, '2.0000000', 'COMPLETED', 'withdrawal_hash_1', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM users LIMIT 1), 'XLM', 'SELL', '500.0000000', '0.1250000', '0.6250000', 'PENDING', NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding balances (these would normally be calculated by the service)
INSERT INTO balances (id, "userId", asset, available, locked, "averageCost") VALUES
('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users LIMIT 1), 'XLM', '13500.0000000', '0.0000000', '0.1175000'),
('660e8400-e29b-41d4-a716-446655440002', (SELECT id FROM users LIMIT 1), 'USDC', '798.0000000', '0.0000000', '1.0000000'),
('660e8400-e29b-41d4-a716-446655440003', (SELECT id FROM users LIMIT 1), 'BTC', '0.0100000', '0.0000000', '45000.0000000')
ON CONFLICT ("userId", asset) DO UPDATE SET
    available = EXCLUDED.available,
    locked = EXCLUDED.locked,
    "averageCost" = EXCLUDED."averageCost";

-- Add some sample data for a second user if exists
INSERT INTO transactions (id, "userId", asset, type, amount, price, fee, status, "txHash", "createdAt") 
SELECT 
    '550e8400-e29b-41d4-a716-446655440009',
    u.id,
    'XLM',
    'DEPOSIT',
    '5000.0000000',
    NULL,
    '0.0000000',
    'COMPLETED',
    'deposit_hash_3',
    NOW() - INTERVAL '15 days'
FROM users u 
WHERE u.id != (SELECT id FROM users LIMIT 1) 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO balances (id, "userId", asset, available, locked, "averageCost")
SELECT 
    '660e8400-e29b-41d4-a716-446655440004',
    u.id,
    'XLM',
    '5000.0000000',
    '0.0000000',
    '0.0000000'
FROM users u 
WHERE u.id != (SELECT id FROM users LIMIT 1) 
LIMIT 1
ON CONFLICT ("userId", asset) DO NOTHING;
