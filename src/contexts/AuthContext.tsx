import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  role: 'CLIENTE' | 'PROMOTOR' | 'ADMIN';
}

interface AuthContextData {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    console.log("➡️ Buscando perfil no banco para o ID:", userId);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) console.error("❌ Erro ao buscar perfil:", error.message);
    return data as UserProfile;
  }

    useEffect(() => {
    console.log("🚀 Iniciando Motor de Autenticação...");
    
    // O DISJUNTOR: Se o Supabase não responder em 4 segundos, nós chutamos a porta!
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ TIMEOUT: O Supabase ignorou a gente. Liberando o site à força!");
      setLoading(false);
    }, 4000);

    async function initializeAuth() {
      try {
        console.log("⏳ 1. Pedindo sessão ao Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("✅ 2. Supabase respondeu!");
        if (error) throw error;

        if (session) {
          console.log("⏳ 3. Buscando perfil...");
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        }
      } catch (err) {
        console.error("❌ Erro crítico no initializeAuth:", err);
      } finally {
        clearTimeout(timeoutId); // Desarma a bomba se o Supabase responder rápido
        setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("❌ Erro no onAuthStateChange:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId); // Limpeza de memória
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, password: pass, options: { data: { full_name: name } } 
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {!loading ? children : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 font-medium">Conectando ao servidor...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
}