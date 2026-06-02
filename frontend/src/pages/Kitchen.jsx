import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Check, ChefHat, PlusCircle, Trash2, Image, Star, Edit, X } from 'lucide-react';
import { playBeep } from '../utils/audio';


export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'finished'

  useEffect(() => {
    // 1. Carregar pedidos iniciais
    fetch('/api/kitchen/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      })
      .catch(err => console.error(err));

    // 2. Conectar socket para pedidos em tempo real
    const socket = io(import.meta.env.VITE_API_URL || '', {
      path: '/socket.io'
    });
    
    socket.on('new_order', (order) => {
      // Tocar som de notificação (Beep nativo do navegador)
      playBeep();

      setOrders(prev => [...prev, order]);
    });

    socket.on('order_status_update', (updatedOrder) => {
      if (updatedOrder.status === 'paid' || updatedOrder.status === 'canceled') {
        // Remover da fila de ativos
        setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      } else {
        // Atualizar status
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
    });

    return () => socket.disconnect();
  }, []);



  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const clearFinishedOrders = async () => {
    if (window.confirm('Tem certeza que deseja limpar a tela e remover todos os pedidos finalizados? (Eles ainda poderão ser cobrados no caixa normalmente)')) {
      const finishedIds = orders.filter(o => o.status === 'ready').map(o => o.id);
      
      // Remove da tela imediatamente para UX rápida
      setOrders(prev => prev.filter(o => o.status !== 'ready'));

      // Atualiza o banco em background para "delivered" (esconde da cozinha, mas mantém pro caixa)
      for (const id of finishedIds) {
        fetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'delivered' })
        }).catch(err => console.error('Erro limpando pedido:', err));
      }
      
      toast.success('Pedidos finalizados foram limpos da tela!');
    }
  };



  const activeOrders = orders.filter(o => o.status !== 'ready' && o.status !== 'paid' && o.status !== 'canceled');
  const finishedOrders = orders.filter(o => o.status === 'ready');
  const displayOrders = activeTab === 'active' ? activeOrders : finishedOrders;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Toaster position="top-right" />
      <header className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat color="var(--primary)" />
          Painel da Cozinha (Monitor de Pedidos)
        </h1>
        <span style={{ padding: '4px 12px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '0.85rem' }}>
          {activeOrders.length} Pedidos Ativos
        </span>
      </header>

      {/* ABAS DA COZINHA */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
              background: activeTab === 'active' ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === 'active' ? 'white' : 'var(--text-muted)'
            }}
          >
            Fila de Preparo ({activeOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('finished')}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
              background: activeTab === 'finished' ? 'var(--success)' : 'var(--bg-card)',
              color: activeTab === 'finished' ? 'white' : 'var(--text-muted)'
            }}
          >
            Finalizados ({finishedOrders.length})
          </button>
        </div>
        
        {activeTab === 'finished' && finishedOrders.length > 0 && (
          <button 
            onClick={clearFinishedOrders}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--danger)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
              background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Trash2 size={16} /> Limpar Finalizados
          </button>
        )}
      </div>

      {/* CONTEÚDO: FILA DE PEDIDOS */}
          {displayOrders.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
              <ChefHat size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
              <h3>{activeTab === 'active' ? 'Cozinha tranquila!' : 'Nenhum pedido finalizado.'}</h3>
              <p>{activeTab === 'active' ? 'Nenhum pedido na fila de preparo no momento.' : 'Os pedidos marcados como "Finalizado" aparecerão aqui.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {displayOrders.map(order => (
                <div 
                  key={order.id} 
                  className="card" 
                  style={{ 
                    borderLeft: order.status === 'preparing' ? '4px solid var(--primary)' : 
                                order.status === 'ready' ? '4px solid var(--success)' : 
                                '4px solid #a0a0a5'
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">
                      Mesa {order.table_session?.table_number ?? '?'}
                      {order.comanda_number && ` • Comanda ${order.comanda_number}`}
                    </span>
                    <span className="text-muted text-sm">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {order.waiter_name && (
                    <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px' }}>
                      👨‍🍳 Garçom: {order.waiter_name}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        {item.product?.image_url && (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name} 
                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} 
                          />
                        )}
                        <div>
                          <div className="font-bold">{item.quantity}x {item.product?.name ?? 'Item'}</div>
                          {item.notes && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', paddingLeft: '8px', borderLeft: '2px solid var(--danger)', marginTop: '4px' }}>Obs: {item.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      <button 
                        onClick={() => updateStatus(order.id, 'pending')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'pending' ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: order.status === 'pending' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'pending' ? 'bold' : 'normal'
                        }}
                      >
                        Novo
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'preparing' ? 'var(--primary)' : 'transparent',
                          color: order.status === 'preparing' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'preparing' ? 'bold' : 'normal'
                        }}
                      >
                        Preparando
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'ready' ? 'var(--success)' : 'transparent',
                          color: order.status === 'ready' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'ready' ? 'bold' : 'normal'
                        }}
                      >
                        Finalizado
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
