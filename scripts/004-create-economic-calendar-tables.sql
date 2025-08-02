-- Economic Events Table
CREATE TABLE economic_events (
    event_id UUID PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    country VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    importance_level VARCHAR(50) NOT NULL,
    currency_affected VARCHAR(50),
    previous_value VARCHAR(100),
    forecast_value VARCHAR(100),
    actual_value VARCHAR(100),
    description TEXT,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Impact Analysis Table
CREATE TABLE event_impact_analysis (
    analysis_id UUID PRIMARY KEY,
    event_id UUID REFERENCES economic_events(event_id),
    asset_class VARCHAR(100),
    expected_impact_direction VARCHAR(50),
    confidence_level INTEGER,
    analysis_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Event Alerts Table
CREATE TABLE user_event_alerts (
    alert_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES economic_events(event_id),
    alert_time_before INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);