import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
// Importando o gerador de QR Code
import QRCode from 'react-qr-code';

interface TicketData {
  id: string;
  status: string;
  events: {
    title: string;
    date: string;
    image_url: string;
  };
}

export function MyTickets() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Guardamos o ID do ingresso que o usuário quer ver o QR Code
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyTickets() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            id,
            status,
            events (
              title,
              date,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('id', { ascending: false });

        if (error) throw error;
        if (data) setTickets(data as any);
        
      } catch (err) {
        console.error('Erro ao carregar ingressos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyTickets();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 relative">
      {/* O MODAL DO QR CODE (Só aparece se tiver um ingresso selecionado) */}
      {selectedTicketId && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative animate-fade-in-up">
            <button 
              onClick={() => setSelectedTicketId(null)}
              className="absolute top-4 right-5 text-gray-400 hover:text-red-500 font-bold text-xl transition-colors"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ingresso Digital</h3>
            <p className="text-gray-500 text-sm mb-6">Apresente este código na entrada do evento.</p>
            
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-indigo-100 inline-block shadow-inner">
              {/* O componente lê a string e desenha o código na hora */}
              <QRCode value={selectedTicketId} size={200} fgColor="#1e1b4b" />
            </div>
            
            <p className="mt-6 text-xs text-gray-400 font-mono break-all bg-gray-50 p-2 rounded">
              {selectedTicketId}
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-gray-900 mb-8">Meus Ingressos</h1>

      {tickets.length > 0 ? (
        <div className="grid gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
              <div className="w-full md:w-48 h-32 md:h-auto relative">
                <img 
                  src={ticket.events.image_url} 
                  alt={ticket.events.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">{ticket.events.title}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    📅 {new Date(ticket.events.date).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <p className="text-xs text-gray-400 font-mono">ID: {ticket.id.split('-')[0]}...</p>
                  
                  {/* O GATILHO: Avisa ao React qual ingresso o usuário quer ver */}
                  <button 
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="text-indigo-600 font-bold text-sm hover:underline cursor-pointer"
                  >
                    Ver QR Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-gray-50 p-12 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Você ainda não possui ingressos comprados.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 text-indigo-600 font-bold hover:underline"
          >
            Explorar eventos disponíveis
          </button>
        </div>
      )}
    </div>
  );
}