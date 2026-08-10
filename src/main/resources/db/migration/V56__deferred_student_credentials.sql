-- Personal student cards are created before a usable LMS password is issued.
-- Existing accounts already have credentials, so only new deferred cards set this false.
ALTER TABLE users
    ADD COLUMN credentials_initialized BOOLEAN NOT NULL DEFAULT TRUE;
