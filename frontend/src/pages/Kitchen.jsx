import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Check, ChefHat } from 'lucide-react';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // 1. Carregar pedidos iniciais
    fetch('http://localhost:3000/api/kitchen/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));

    // 2. Conectar socket para pedidos em tempo real
    const socket = io('http://localhost:3000');
    
    socket.on('new_order', (order) => {
      setOrders(prev => [...prev, order]);
    });

    socket.on('order_status_update', (updatedOrder) => {
      if (updatedOrder.status === 'ready' || updatedOrder.status === 'delivered') {
        // Remover da tela da cozinha
        setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      } else {
        // Atualizar status na tela (ex: mudou de pending para preparing)
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
    });

    return () => socket.disconnect();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:3000/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar pedido');
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <header className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat color="var(--primary)" />
          Painel da Cozinha
        </h1>
        <span style={{ padding: '4px 12px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '0.85rem' }}>
          {orders.length} Pedidos Ativos
        </span>
      </header>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
          <ChefHat size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
          <h3>Cozinha tranquila!</h3>
          <p>Nenhum pedido na fila de preparo no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ borderLeft: order.status === 'preparing' ? '4px solid var(--primary)' : '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">Mesa {order.table_session.table_number}</span>
                <span className="text-muted text-sm">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '8px' }}>
                    <div className="font-bold">{item.quantity}x {item.product.name}</div>
                    {item.notes && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', paddingLeft: '8px', borderLeft: '2px solid var(--danger)' }}>Obs: {item.notes}</div>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' ? (
                  <button 
                    onClick={() => updateStatus(order.id, 'preparing')}
                    className="btn btn-outline" 
                    style={{ flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    Preparar
                  </button>
                ) : (
                  <button 
                    onClick={() => updateStatus(order.id, 'ready')}
                    className="btn btn-primary" 
                    style={{ flex: 1, background: 'var(--success)' }}
                  >
                    <Check size={18} style={{ marginRight: '8px' }} />
                    Concluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
