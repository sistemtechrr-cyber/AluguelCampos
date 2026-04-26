import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  nome: string;
  email: string;
  celular?: string;
  tipo: 'admin' | 'user' | 'proprietario';
  saldo_creditos: number;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string, celular: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isProprietario: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    } else if (!error && !data && user) {
      const nome = user.user_metadata?.nome || '';
      const celular = user.user_metadata?.celular || '';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            nome: nome,
            email: user.email,
            celular: celular,
            tipo: 'user',
            saldo_creditos: 0
          }
        ])
        .select()
        .single();
      
      if (!insertError && newProfile) {
        setProfile(newProfile);
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, nome: string, celular: string) => {
    try {
      console.log('Cadastrando com:', { email, nome, celular });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
            celular: celular,
          },
        },
      });

      if (error) {
        console.error('Erro no signUp:', error);
        return { error };
      }

      if (data?.user) {
        console.log('Usuário criado, criando perfil...');
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              nome: nome,
              email: email,
              celular: celular,
              tipo: 'user',
              saldo_creditos: 0
            }
          ]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        } else {
          console.log('Perfil criado com sucesso!');
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no signUp:', error);
      return { error: error as Error };
    }
  };

  // CORREÇÃO AQUI!!!!!
  const signOut = async () => {
    try {
      console.log('🔴 AuthContext: Iniciando logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro ao fazer logout:', error);
        throw error;
      }
      
      // LIMPAR TODOS OS ESTADOS
      setUser(null);
      setProfile(null);
      setSession(null);
      
      console.log('✅ Logout realizado! Estados limpos:', { user: null, profile: null, session: null });
    } catch (error) {
      console.error('❌ Erro no signOut:', error);
    }
  };

  const isAdmin = profile?.tipo === 'admin';
  const isProprietario = profile?.tipo === 'proprietario';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        isAdmin,
        isProprietario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}