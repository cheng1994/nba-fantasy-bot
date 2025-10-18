-- OPTIONAL: Create a local users table to sync Stack Auth users
-- Only use this if you need foreign key constraints or want to store additional user data
-- You'll need to implement a sync mechanism to keep this updated with Stack Auth

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Stack Auth user.id
    display_name TEXT,
    email TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- You can add custom fields here that Stack Auth doesn't provide
    -- For example: preferences, settings, etc.
    custom_data JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- NOW you can add the foreign key to fantasy_teams
ALTER TABLE fantasy_teams
    ADD CONSTRAINT fk_fantasy_teams_owner 
    FOREIGN KEY (owner) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

COMMENT ON TABLE users IS 'Local mirror of Stack Auth users - must be synced via application code';
COMMENT ON COLUMN users.id IS 'Stack Auth user.id - synced from Stack Auth';

