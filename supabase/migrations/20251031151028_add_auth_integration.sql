/*
  # Add Authentication Integration
  
  1. Changes
    - Link users table with Supabase auth.users
    - Add trigger to create user profile automatically on signup
    - Update RLS policies to work with auth system
    - Add function to sync user data with auth
  
  2. Security
    - Users table now linked to auth.uid()
    - Automatic profile creation on signup
    - Default users are type 'user', admins must be set manually
    - RLS policies ensure only authenticated users can modify their data
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;

-- Modify users table to use auth.uid as primary key
DO $$ 
BEGIN
  -- Check if we need to modify the id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
  ) THEN
    -- Drop the existing primary key constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
    
    -- Drop default for id column
    ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
  END IF;
END $$;

-- Recreate primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- New RLS policies for users table
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update fields policies to ensure they check authentication properly
DROP POLICY IF EXISTS "Admins can insert fields" ON fields;
DROP POLICY IF EXISTS "Admins can update fields" ON fields;
DROP POLICY IF EXISTS "Admins can delete fields" ON fields;

CREATE POLICY "Authenticated admins can insert fields"
  ON fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can update fields"
  ON fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can delete fields"
  ON fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );