import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';

export function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); 

  const [usersList, setUsersList] = useState<any[]>([]);
  const [userRefreshKey, setUserRefreshKey] = useState(0);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', image_url: '', price: '0.00', total_tickets: '100',
  });

  // 1. BUSCAR EVENTOS
  useEffect(() => {
    async function fetchDashboardEvents() {
      if (!user) return;
      setLoadingEvents(true);
      try {
        let query = supabase.from('events').select('*').order('date', { ascending: true });
        if (user.role !== 'ADMIN') {
          query = query.eq('promoter_id', user.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data) setEventsList(data);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchDashboardEvents();
  }, [user, refreshKey]);

  // 2. BUSCAR USUÁRIOS
  useEffect(() => {
    async function fetchUsers() {
      if (user?.role !== 'ADMIN') return;
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (error) throw error;
        if (data) setUsersList(data);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      }
    }
    fetchUsers();
  }, [user, userRefreshKey]);

  // 3. FUNÇÃO PARA ATIVAR O MODO DE EDIÇÃO
  const startEditing = (evt: any) => {
    setEditingEventId(evt.id);
    
    // Tratamento para a data local se adaptar ao formato do input datetime-local
    // Remove os segundos e o fuso horário (YYYY-MM-DDTHH:MM)
    const formattedDate = evt.date ? evt.date.substring(0, 16) : '';

    setFormData({
      title: evt.title,
      description: evt.description,
      date: formattedDate,
      image_url: evt.image_url,
      price: evt.price.toFixed(2).replace('.', ','),
      total_tickets: evt.total_tickets.toString(),
    });
  };

  // 4. FUNÇÃO PARA CANCELAR EDIÇÃO
  const cancelEditing = () => {
    setEditingEventId(null);
    setFormData({ title: '', description: '', date: '', image_url: '', price: '0.00', total_tickets: '100' });
  };

  // 5. ATUALIZAR CARGO
  const handleRoleChange = async (userId: string, currentName: string, newRole: string) => {
    if (!window.confirm(`Tem certeza que deseja promover ${currentName} para ${newRole}?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      alert(`✅ Cargo de ${currentName} atualizado!`);
      setUserRefreshKey(old => old + 1);
    } catch (err: any) {
      alert('Erro ao atualizar cargo: ' + err.message);
    }
  };

  // 6. ENVIAR FORMULÁRIO (HÍBRIDO: CRIA OU ATUALIZA)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const numericPrice = parseFloat(formData.price.replace('.', '').replace(',', '.'));
      const capacity = parseInt(formData.total_tickets, 10);

      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        image_url: formData.image_url,
        price: numericPrice,
        total_tickets: capacity,
      };

      if (editingEventId) {
        //  Atualiza a linha existente ---
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEventId);

        if (error) throw error;
        alert(`✅ Evento atualizado com sucesso!`);
        setEditingEventId(null); // Desativa o modo edição
      } else {
        // Insere uma nova linha ---
        const { error } = await supabase.from('events').insert([
          {
            ...payload,
            tickets_sold: 0,
            promoter_id: user.id,
            status: 'PUBLISHED'
          }
        ]);

        if (error) throw error;
        alert(`✅ Evento publicado com sucesso!`);
      }

      setRefreshKey(oldKey => oldKey + 1); 
      setFormData({ title: '', description: '', date: '', image_url: '', price: '0.00', total_tickets: '100' });

    } catch (err: any) {
      alert('Erro ao processar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 pb-20">
      
      {/* SEÇÃO EXCLUSIVA DO ADMINISTRADOR */}
      {user?.role === 'ADMIN' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
            <div className="bg-indigo-900 p-6 rounded-2xl text-white shadow-lg">
              <p className="text-indigo-300 text-sm font-bold uppercase">Visão Global</p>
              <h2 className="text-3xl font-black mt-2">Relatórios Master</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-gray-400 text-sm font-bold">Total de Eventos</p>
              <p className="text-4xl font-black text-gray-900">{eventsList.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-gray-400 text-sm font-bold">Usuários Ativos</p>
              <p className="text-4xl font-black text-gray-900">{usersList.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-12 animate-fade-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-4">Gestão de Permissões (Usuários)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-bold text-gray-500 pl-4">Nome do Usuário</th>
                    <th className="pb-3 text-sm font-bold text-gray-500">ID da Conta</th>
                    <th className="pb-3 text-sm font-bold text-gray-500">Nível de Acesso (Cargo)</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 pl-4 font-bold text-gray-800">{u.full_name}</td>
                      <td className="py-4 text-xs font-mono text-gray-400">{u.id.split('-')[0]}...</td>
                      <td className="py-4">
                        <select
                          className={`border rounded-lg p-2 text-sm font-bold cursor-pointer outline-none
                            ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                              u.role === 'PROMOTOR' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                              'bg-gray-100 text-gray-700 border-gray-200'}`}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, u.full_name, e.target.value)}
                        >
                          <option value="CLIENTE">Cliente (Comprador)</option>
                          <option value="PROMOTOR">Promotor (Cria Eventos)</option>
                          <option value="ADMIN">Administrador (Master)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/*FORMULÁRIO E LISTA DE EVENTOS */}
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* FORMULÁRIO */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up h-fit sticky top-24">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-gray-900">
              {editingEventId ? '✏️ Editar Evento' : 'Configurar Novo Evento'}
            </h1>
            {editingEventId && (
              <button 
                onClick={cancelEditing}
                className="text-xs bg-gray-100 hover:bg-gray-200 font-bold text-gray-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700">Título do Evento</label>
              <input type="text" required value={formData.title} className="w-full p-3 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Descrição Detalhada</label>
              <textarea required value={formData.description} className="w-full p-3 border border-gray-200 rounded-xl mt-1 h-24 focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Data e Hora</label>
                <input type="datetime-local" required value={formData.date} className="w-full p-3 border border-gray-200 rounded-xl mt-1" onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Preço (R$)</label>
                <input type="text" required value={formData.price} className="w-full p-3 border border-gray-200 rounded-xl mt-1 font-bold text-indigo-600" onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Qtd. Ingressos</label>
                <input type="number" min="1" required value={formData.total_tickets} className="w-full p-3 border border-gray-200 rounded-xl mt-1 font-bold text-green-600" onChange={(e) => setFormData({...formData, total_tickets: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">URL da Imagem</label>
                <input type="url" required value={formData.image_url} placeholder="https://..." className="w-full p-3 border border-gray-200 rounded-xl mt-1" onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full text-white font-bold py-4 rounded-xl mt-4 transition-colors shadow-md
                ${loading ? 'bg-gray-400' : editingEventId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Processando...' : editingEventId ? 'Salvar Alterações' : 'Publicar Evento'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DE EVENTOS */}
        <div className="flex-[1.5] bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
          <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {user?.role === 'ADMIN' ? 'Todos os Eventos' : 'Meus Eventos Publicados'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Gerencie ou edite as informações dos eventos.</p>
            </div>
          </div>

          {loadingEvents ? (
             <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : eventsList.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">Nenhum evento encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsList.map((evt) => {
                const percentSold = Math.round((evt.tickets_sold / evt.total_tickets) * 100) || 0;
                const isSelected = editingEventId === evt.id;
                
                return (
                  <div 
                    key={evt.id} 
                    className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all items-start sm:items-center
                      ${isSelected ? 'border-amber-400 bg-amber-50/30' : 'border-gray-100 hover:border-indigo-100 hover:shadow-md'}`}
                  >
                    <img src={evt.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 line-clamp-1">{evt.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(evt.date).toLocaleDateString('pt-BR')} | 💰 R$ {evt.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full sm:w-32 text-left sm:text-right">
                      <p className="text-xs font-bold text-gray-600 mb-1">Vendas: {percentSold}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${percentSold > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${percentSold}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{evt.tickets_sold} / {evt.total_tickets}</p>
                    </div>

                    {/* BUTTON DE ASSINATURA: O Gatilho de Edição */}
                    <button
                      onClick={() => startEditing(evt)}
                      disabled={isSelected}
                      className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors w-full sm:w-auto text-center
                        ${isSelected ? 'bg-amber-100 text-amber-700 cursor-not-allowed' : 'bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200'}`}
                    >
                      {isSelected ? 'Editando' : 'Editar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}