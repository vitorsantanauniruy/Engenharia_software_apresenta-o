import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
// 1. IMPORTAÇÃO NOVA: Precisamos do supabase para checar o crachá rápido
import { supabase } from '../services/supabase'; 

export function Login() {
  const { signIn, signUp } = useContext(AuthContext); 
  const navigate = useNavigate();
  const location = useLocation();
  
  // Descobre de onde o utilizador veio antes de ser barrado
  const from = location.state?.from?.pathname || '/';

  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(''); 
    
    try {
      if (isRegistering) {
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        await signUp(email, password, name);
        
        // Se acabou de criar a conta, vai para a Home
        navigate('/', { replace: true }); 
        
      } else {
        // Faz o login no motor de autenticação
        await signIn(email, password);
        
        // 2. A MÁGICA DA NAVEGAÇÃO VIP ACONTECE AQUI!
        // Pega o ID do usuário que acabou de ser autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Olha na tabela profile qual é o cargo dele
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          // O Direcionamento VIP
          if (profile && (profile.role === 'ADMIN' || profile.role === 'PROMOTOR')) {
             navigate('/admin', { replace: true });
             return; // Encerra a função aqui para o código não continuar descendo!
          }
        }
        
        // Se for Cliente (ou se der algum erro no perfil), vai para onde queria ir ou para a Home
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (error.message.includes('User already registered')) {
        setErrorMsg('Este e-mail já está registado.');
      } else {
        setErrorMsg(error.message || 'Ocorreu um erro na autenticação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in-up">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {isRegistering ? 'Crie sua Conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-gray-500">
            {isRegistering ? 'Junte-se a milhares de fãs de eventos' : 'Aceda aos seus bilhetes e compras'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
              <input required={isRegistering} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="O seu nome" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemplo@email.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Senha</label>
              {!isRegistering && <span className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">Esqueceu?</span>}
            </div>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2
              ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
              }} 
              className="ml-2 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isRegistering ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}