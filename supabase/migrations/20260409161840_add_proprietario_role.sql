/*
  # Add Proprietario Role

  ## Summary
  This migration adds a new "proprietario" (field owner) user role and links fields to their owners in the database.

  ## Changes

  ### 1. Modified Tables
  - `users`
    - Expands the `tipo` column to accept 'admin', 'user', or 'proprietario'
  - `fields`
    - Adds `owner_id` column (uuid, nullable FK to users.id) so fields can be linked to a proprietario account

  ### 2. New RLS Policies
  - Proprietarios can view bookings for fields they own
  - Proprietarios can insert and update their own fields

  ### 4. Important Notes
  - Existing fields have owner_id = NULL; admins can assign ownership
  - The proprietario role can view bookings for their fields but cannot manage other users' data
  - Admins retain full control
*/

-- Extend the tipo CHECK constraint to include 'proprietario'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tipo_check;
ALTER TABLE users ADD CONSTRAINT users_tipo_check
  CHECK (tipo IN ('admin', 'user', 'proprietario'));

-- Add owner_id to fields table (links a field to a proprietario user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fields' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE fields ADD COLUMN owner_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Allow proprietarios to view bookings for fields they own
CREATE POLICY "Proprietarios can view bookings for own fields"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = bookings.field_id
        AND fields.owner_id = auth.uid()
    )
  );

-- Allow proprietarios to insert their own fields
CREATE POLICY "Proprietarios can insert own fields"
  ON fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.tipo = 'proprietario'
    )
    AND owner_id = auth.uid()
  );

-- Allow proprietarios to update their own fields
CREATE POLICY "Proprietarios can update own fields"
  ON fields FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.tipo = 'proprietario'
    )
    AND owner_id = auth.uid()
  );
