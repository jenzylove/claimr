-- Claimr users table: maps a wallet address to a verified X (Twitter) handle.
-- wallet_address is the stable identity key for both Circle and MetaMask users.
-- Stored lowercase for consistent lookups (addresses are case-insensitive).

CREATE TABLE IF NOT EXISTS users (
  wallet_address  TEXT PRIMARY KEY,
  x_handle        TEXT,
  x_user_id       TEXT,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by handle (e.g. to check if a handle is already claimed by
-- another wallet, preventing one X account linking to multiple wallets).
CREATE UNIQUE INDEX IF NOT EXISTS users_x_handle_unique
  ON users (x_handle)
  WHERE x_handle IS NOT NULL;