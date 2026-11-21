CREATE TABLE IF NOT EXISTS demo_assistant_budget (
	id TEXT PRIMARY KEY NOT NULL,
	remaining INTEGER NOT NULL CONSTRAINT demo_assistant_remaining_range CHECK (remaining BETWEEN 0 AND 60),
	last_call REAL NOT NULL DEFAULT 0
);
