import React, { useEffect, useState, useContext } from 'react';
import { EventCard } from '../components/EventCard';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
import type { EventProps } from '../types/index';

export function Home() {
  const { loading: authLoading } = useContext(AuthContext);
  const [events, setEvents] = useState<EventProps[]>([]);
  // Iniciamos com true para mostrar o spinner até resolvermos tudo
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    // A MÁGICA: Se o AuthContext ainda está carregando no F5, nós não fazemos nada. Esperamos!
    if (authLoading) return;

    console.log("🚀 [Home] Auth pronta! Iniciando carregamento dos eventos...");

    const timeoutId = setTimeout(() => {
      console.warn("⚠️ [Home] TIMEOUT: O banco de dados demorou muito.");
      setLoadingEvents(false);
    }, 5000); // Aumentei um pouco a tolerância

    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'PUBLISHED')
          .order('date', { ascending: true });

        if (error) throw error;
        
        if (data) {
          const formattedEvents = data.map(event => ({
            id: event.id,
            title: event.title,
            date: new Date(event.date).toLocaleDateString('pt-BR'), 
            price: event.price, // Garantindo que o preço real está aqui também
            imageUrl: event.image_url,
            description: event.description // Pegando a descrição do banco!
          }));
          
          setEvents(formattedEvents as any);
        }
      } catch (error) {
        console.error('❌ [Home] Erro crítico:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [authLoading]); // A Home agora reage quando o authLoading termina

  // Exibe o spinner se a Auth ou a Home estiverem carregando
  if (authLoading || loadingEvents) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium text-sm">
          {authLoading ? "Verificando sessão..." : "Buscando eventos no banco de dados..."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
      {events.length > 0 ? (
        events.map(event => <EventCard key={event.id} {...event} />)
      ) : (
        <div className="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm border border-gray-100">
          <p className="text-xl font-bold text-gray-800 mb-2">Nenhum evento encontrado</p>
          <p className="text-gray-500">O banco de dados está conectado, mas a tabela de eventos está vazia.</p>
        </div>
      )}
    </div>
  );
}