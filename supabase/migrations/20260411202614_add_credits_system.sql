/*
  # Credits System for Field Owners

  ## Summary
  Implements a manual credit system for field owners with full history tracking.

  ## Changes

  ### Modified Tables
  - `users`: Added `saldo_creditos` column (integer, default 0) to track owner credit balance

  ### New Tables
  - `historico_creditos`: Records all manual credit additions made by admins
    - `id` (uuid, primary key)
    - `owner_id` (uuid, references users.id) - the owner who received credits
    - `admin_id` (uuid, references users.id) - the admin who added the credits
    - `admin_nome` (text) - name of admin at time of insertion
    - `owner_nome` (text) - name of owner at time of insertion
    - `quantidade` (integer) - number of credits added
    - `observacao` (text, nullable) - optional note
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on `historico_creditos`
  - Admins can insert and read all records
  - Owners can read their own history
*/

-- Add saldo_creditos to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'saldo_creditos'
  ) THEN
    ALTER TABLE users ADD COLUMN saldo_creditos integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create historico_creditos table
CREATE TABLE IF NOT EXISTS historico_creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_nome text NOT NULL DEFAULT '',
  owner_nome text NOT NULL DEFAULT '',
  quantidade integer NOT NULL CHECK (quantidade > 0),
  observacao text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE historico_creditos ENABLE ROW LEVEL SECURITY;

-- Admins can read all credit history
CREATE POLICY "Admins can read all credit history"
  ON historico_creditos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

-- Admins can insert credit history
CREATE POLICY "Admins can insert credit history"
  ON historico_creditos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

-- Owners can read their own credit history
CREATE POLICY "Owners can read own credit history"
  ON historico_creditos FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_historico_creditos_owner_id ON historico_creditos(owner_id);
CREATE INDEX IF NOT EXISTS idx_historico_creditos_created_at ON historico_creditos(created_at DESC);
