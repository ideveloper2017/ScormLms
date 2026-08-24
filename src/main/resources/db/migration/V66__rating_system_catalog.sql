CREATE TABLE rating_systems (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    short_name VARCHAR(80) NOT NULL,
    min_score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 100,
    pass_score INTEGER NOT NULL DEFAULT 60,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT ck_rating_system_range CHECK (min_score >= 0 AND max_score > min_score AND pass_score BETWEEN min_score AND max_score)
);

CREATE UNIQUE INDEX uq_rating_systems_live_name ON rating_systems(LOWER(name)) WHERE deleted = FALSE;
CREATE UNIQUE INDEX uq_rating_systems_live_short_name ON rating_systems(LOWER(short_name)) WHERE deleted = FALSE;

INSERT INTO rating_systems(name, short_name, min_score, max_score, pass_score, active)
VALUES ('100 ballik baholash tizimi', '100 ball', 0, 100, 60, TRUE);
