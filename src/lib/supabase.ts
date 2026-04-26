import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Field = {
  id: string;
  nome: string;
  valor: number;
  foto_url: string;
  dono: string;
  localizacao: string;
  horarios_disponiveis: string[];
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'user' | 'proprietario';
  created_at: string;
};

export type Booking = {
  id: string;
  field_id: string;
  user_id: string;
  horario: string;
  data: string;
  status: string;
  created_at: string;
  fields?: Pick<Field, 'id' | 'nome' | 'localizacao' | 'foto_url'>;
  users?: Pick<User, 'id' | 'nome' | 'email'>;
};
