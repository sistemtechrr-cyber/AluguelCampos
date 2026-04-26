-- Schema for Fields Rental App
-- 
-- Overview:
-- This migration creates the database structure for a sports field rental application.
-- Users can view available fields and administrators can manage field listings.
--
-- New Tables:
-- 1. users (id, nome, email, tipo, created_at)
-- 2. fields (id, nome, valor, foto_url, dono, localizacao, horarios_disponiveis, created_at, updated_at)
--
-- Security:
-- RLS enabled on both tables
-- Users can read all profiles
-- Everyone can read fields, only admins can insert/update/delete

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo text NOT NULL DEFAULT 'user' CHECK (tipo IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  foto_url text NOT NULL,
  dono text NOT NULL,
  localizacao text NOT NULL,
  horarios_disponiveis jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert themselves"
  ON users FOR INSERT
  WITH CHECK (true);

-- Fields policies
CREATE POLICY "Anyone can read fields"
  ON fields FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert fields"
  ON fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

CREATE POLICY "Admins can update fields"
  ON fields FOR UPDATE
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

CREATE POLICY "Admins can delete fields"
  ON fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to fields table
CREATE TRIGGER update_fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO fields (nome, valor, foto_url, dono, localizacao, horarios_disponiveis) VALUES
  ('Campo Society Vila Verde', 150.00, 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800', 'João Silva', 'Rua das Flores, 123 - Vila Verde', '["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"]'::jsonb),
  ('Quadra Premium Centro', 200.00, 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=800', 'Maria Santos', 'Av. Principal, 456 - Centro', '["07:00-09:00", "09:00-11:00", "13:00-15:00", "15:00-17:00", "19:00-21:00"]'::jsonb),
  ('Arena Sports Jardim', 180.00, 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=800', 'Carlos Pereira', 'Rua do Jardim, 789 - Jardim América', '["08:00-10:00", "12:00-14:00", "14:00-16:00", "18:00-20:00", "20:00-22:00"]'::jsonb),
  ('Campo Estrela do Sul', 160.00, 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ana Costa', 'Rua Estrela, 321 - Zona Sul', '["09:00-11:00", "11:00-13:00", "15:00-17:00", "17:00-19:00", "19:00-21:00"]'::jsonb)
ON CONFLICT DO NOTHING;