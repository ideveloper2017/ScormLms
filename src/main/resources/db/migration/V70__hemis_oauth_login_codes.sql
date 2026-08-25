CREATE TABLE hemis_oauth_login_codes (
    id          BIGSERIAL PRIMARY KEY,
    code_hash   VARCHAR(64) NOT NULL UNIQUE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hemis_oauth_login_codes_expiry
    ON hemis_oauth_login_codes(expires_at);
