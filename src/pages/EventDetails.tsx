import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { EventProps } from '../types/index';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ARQUITETURA DE ELITE: Tenta pegar os dados que vieram do clique na Home
  const initialEvent = location.state?.event || null;

  const [event, setEvent] = useState<EventProps | null>(initialEvent);
  // Se já temos o cache, o loading começa direto como FALSE! Zero espera.
  const [loading, setLoading] = useState(!initialEvent);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchEventBackground() {
      try {
        // Busca silenciosa para garantir dados frescos
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setEvent({
            id: data.id,
            title: data.title,
            date: new Date(data.date).toLocaleDateString('pt-BR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            price: data.price,
            imageUrl: data.image_url,
            description: data.description // <-- Garantindo que a busca em background também pega a descrição
          } as any);
        }
      } catch (err) {
        console.error('❌ [EventDetails] Erro na revalidação:', err);
        if (!event) setError(true);
      } finally {
        setLoading(false);
      }
    }

    // Só revalida se realmente tiver um ID na URL
    if (id) fetchEventBackground();
  }, [id, event]);

  if (loading) {
    return (
       <div className="min-h-[60vh] flex justify-center items-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
       </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-800">Evento não encontrado</h2>
        <p className="text-gray-500 mt-2">O evento que você procura pode ter sido removido ou o link é inválido.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-medium hover:bg-indigo-100 transition-colors">
          Voltar para a página inicial
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-fade-in-up mt-8">
      {/* Banner Superior */}
      <div className="h-80 sm:h-96 w-full relative">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-indigo-500 text-white text-sm font-bold rounded-full mb-4">
              Em Breve
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 leading-tight">{event.title}</h1>
            <p className="text-lg text-gray-200 flex items-center gap-2">
              📅 {event.date}
            </p>
          </div>
        </div>
      </div>
      
      {/* Conteúdo Inferior */}
      <div className="p-6 sm:p-10 flex flex-col lg:flex-row justify-between items-start gap-10">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Sobre o evento</h3>
          {/* O whitespace-pre-wrap garante que as quebras de linha que o promotor deu no painel admin sejam respeitadas aqui! */}
          <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
            {(event as any).description || "Descrição não informada pelo organizador."}
          </p>
        </div>
        
        {/* Painel de Compra */}
        <div className="w-full lg:w-80 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-6 sticky top-24">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">Ingressos a partir de</p>
            <p className="text-4xl font-black text-indigo-600">R$ {event.price.toFixed(2)}</p>
          </div>
          
          <div className="h-px w-full bg-gray-200"></div>
          
          <button 
            onClick={() => navigate(`/checkout/${event.id}`)}
            className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Garantir Ingresso
          </button>
          <p className="text-xs text-center text-gray-400 font-medium">
            Pagamento 100% seguro via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}