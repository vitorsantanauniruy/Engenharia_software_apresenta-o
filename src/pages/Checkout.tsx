import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
import QRCode from 'react-qr-code';

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Compra
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<1 | 2>(1); // 1: Resumo, 2: Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix' | ''>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) setEvent(data);
      } catch (err) {
        console.error('Erro ao buscar evento:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchEvent();
  }, [id]);

  // A Lógica de Compra no Banco de Dados (agora só roda no final do Passo 2)
  const handleFinalPurchase = async () => {
    if (!user || !event) return;

    const available = event.total_tickets - event.tickets_sold;
    if (quantity > available) {
      alert(`⚠️ Ops! Só restam ${available} ingressos.`);
      return;
    }

    setProcessing(true);

    try {
      // Simulando o delay do banco/cartão de crédito (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ticketsToInsert = Array.from({ length: quantity }).map(() => ({
        user_id: user.id,
        event_id: event.id,
        status: 'VALID'
      }));

      const { error: ticketError } = await supabase.from('tickets').insert(ticketsToInsert);
      if (ticketError) throw ticketError;

      const { error: updateError } = await supabase
        .from('events')
        .update({ tickets_sold: event.tickets_sold + quantity })
        .eq('id', event.id);

      if (updateError) throw updateError;

      alert(`🎉 Pagamento Aprovado! ${quantity} ingresso(s) garantido(s).`);
      navigate('/meus-ingressos');
      
    } catch (err: any) {
      console.error('Erro na compra:', err);
      alert('Erro ao processar: ' + err.message);
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center p-20 font-bold text-gray-500">Carregando gateway de pagamento...</div>;
  if (!event) return <div className="text-center p-20">Evento não encontrado.</div>;

  const totalPrice = event.price * quantity;
  const isSoldOut = event.tickets_sold >= event.total_tickets;

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8 mb-20 animate-fade-in-up">
      
      {/* HEADER DO CHECKOUT (Progresso) */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-black text-gray-900">Finalizar Pedido</h1>
        <div className="flex gap-2 items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
          <div className={`h-1 w-10 rounded-full ${step === 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* LADO ESQUERDO: Resumo */}
        <div className="flex-[1.2]">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Resumo da Compra</h3>
          <div className="flex gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <img src={event.image_url} className="w-24 h-24 object-cover rounded-lg" alt="" />
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-xl line-clamp-1">{event.title}</h3>
              <p className="text-indigo-600 font-bold text-lg">R$ {event.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">📅 {new Date(event.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="mt-8 p-6 border rounded-xl border-gray-100 bg-white">
              <label className="block text-sm font-bold text-gray-700 mb-4">Selecione a quantidade</label>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold hover:bg-gray-50 hover:border-indigo-200 transition-colors"
                >-</button>
                <span className="text-3xl font-black w-8 text-center text-indigo-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= (event.total_tickets - event.tickets_sold)}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold hover:bg-gray-50 hover:border-indigo-200 transition-colors disabled:opacity-50"
                >+</button>
              </div>
            </div>
          )}
        </div>

        {/* LADO DIREITO: Dinâmico (Revisão -> Pagamento) */}
        <div className="flex-1 bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
          
          {/* PASSO 1: CONFIRMAR DADOS */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Dados do Titular</h3>
              <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <p className="text-sm text-gray-500">Nome: <span className="font-bold text-gray-900">{user?.full_name}</span></p>
                <span className="font-bold text-gray-900">{(user as any)?.email || 'Email não disponível'}</span>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-500 text-sm">Total a pagar:</p>
                <p className="text-4xl font-black text-indigo-900">R$ {totalPrice.toFixed(2)}</p>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={isSoldOut}
                className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md ${
                  isSoldOut ? 'bg-red-100 text-red-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                }`}
              >
                {isSoldOut ? 'Ingressos Esgotados' : 'Avançar para Pagamento ➔'}
              </button>
            </div>
          )}

          {/* PASSO 2: GATEWAY DE PAGAMENTO */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col h-full">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Como quer pagar?</h3>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-500 hover:text-indigo-600">Voltar</button>
                </div>
                
                {/* Botões de Seleção */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button onClick={() => setPaymentMethod('pix')} className={`p-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <span className="text-xl">💠</span> PIX
                  </button>
                  <button onClick={() => setPaymentMethod('credit')} className={`p-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <span className="text-xl">💳</span> Crédito
                  </button>
                  <button onClick={() => setPaymentMethod('debit')} className={`p-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === 'debit' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <span className="text-xl">💳</span> Débito
                  </button>
                </div>

                {/* Formulários Fakes Baseados na Seleção */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 min-h-[180px] flex flex-col justify-center">
                  {!paymentMethod && <p className="text-center text-gray-400 text-sm font-medium">Selecione uma forma de pagamento acima.</p>}
                  
                  {paymentMethod === 'pix' && (
                    <div className="text-center animate-fade-in">
                      <div className="bg-white p-2 border-2 border-dashed border-gray-200 inline-block rounded-xl mb-3">
                         {/* Um QR Code gerado aleatoriamente só para dar a imersão */}
                         <QRCode value="00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5913Gems Tickets" size={100} />
                      </div>
                      <p className="text-xs text-gray-500 font-bold">QR Code de Pagamento Exclusivo</p>
                    </div>
                  )}

                  {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                    <div className="space-y-3 animate-fade-in">
                      <input type="text" placeholder="Número do Cartão" className="w-full text-sm p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none" />
                      <input type="text" placeholder="Nome Impresso no Cartão" className="w-full text-sm p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="MM/AA" className="w-1/2 text-sm p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none" />
                        <input type="text" placeholder="CVV" className="w-1/2 text-sm p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Final */}
              <button 
                onClick={handleFinalPurchase}
                disabled={!paymentMethod || processing}
                className={`w-full font-bold text-lg py-4 rounded-xl mt-6 transition-all shadow-md flex justify-center items-center gap-2
                  ${!paymentMethod ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : processing ? 'bg-indigo-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando Pagamento...
                  </>
                ) : (
                  `Pagar R$ ${totalPrice.toFixed(2)}`
                )}
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}