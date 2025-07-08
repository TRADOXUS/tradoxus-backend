-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    asset_class VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_strategies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create strategy_rules table
CREATE TABLE IF NOT EXISTS strategy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL,
    rule_type VARCHAR(32) NOT NULL CHECK (rule_type IN ('entry', 'exit', 'risk_management')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_strategy_rules_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- Create strategy_conditions table
CREATE TABLE IF NOT EXISTS strategy_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    indicator VARCHAR(50) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    value VARCHAR(50) NOT NULL,
    time_frame VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_strategy_conditions_rule FOREIGN KEY (rule_id) REFERENCES strategy_rules(id) ON DELETE CASCADE
);

-- Create strategy_checkpoints table
CREATE TABLE IF NOT EXISTS strategy_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL,
    text TEXT NOT NULL,
    "order" INT NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('pre-trade', 'post-trade')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_strategy_checkpoints_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_strategy_id ON strategy_rules(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_conditions_rule_id ON strategy_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_strategy_checkpoints_strategy_id ON strategy_checkpoints(strategy_id); 