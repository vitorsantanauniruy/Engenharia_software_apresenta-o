import { createClient } from '@supabase/supabase-js';

//credenciais escondidas no ficheiro .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase!');
}

// Exportamos o "cliente" que será usado pelo nosso sistema para falar com a base de dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey);