import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

// Repare: O nome da função voltou a ser "Layout", o que o App.tsx espera!
export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- O NOSSO CABEÇALHO (HEADER) INTELIGENTE --- */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-indigo-900 tracking-tight">
            VSS<span className="text-indigo-600">Tickets</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                {/* O FILTRO DE ELITE: Botão só para quem manda! */}
                {(user.role === 'ADMIN' || user.role === 'PROMOTOR') && (
                  <Link 
                    to="/admin" 
                    className="text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    ⚙️ Painel Admin
                  </Link>
                )}

                <Link to="/meus-ingressos" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">
                  Meus Ingressos
                </Link>
                
                <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                  <span className="text-sm font-bold text-gray-800">
                    Olá, {user.full_name?.split(' ')[0]}
                  </span>
                  <button 
                    onClick={signOut} 
                    className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                Entrar / Registar
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* --- FIM DO CABEÇALHO --- */}

      {/* AQUI É ONDE AS PÁGINAS (Home, Login, Admin) SÃO RENDERIZADAS */}
      <main className="flex-1 w-full">
        {children}
      </main>

    </div>
  );
}