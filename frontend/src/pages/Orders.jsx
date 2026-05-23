import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { io } from 'socket.io-client';
import { Clock, CheckCircle2, ChefHat } from 'lucide-react';

export default function Orders() {
  const session = useStore(s => s.session);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.session_id) return;

    // 1. Carregar histórico de pedidos da sessão
    fetch(`/api/sessions/${session.session_id}/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar histórico de pedidos:', err);
        setLoading(false);
      });

    // 2. Escutar atualizações e novos pedidos em tempo real
    const socket = io();
    
    socket.on('new_order', (order) => {
      if (order.table_session_id === session.session_id) {
        setOrders(prev => {
          // Evitar duplicar se o pedido já foi carregado
          if (prev.some(o => o.id === order.id)) return prev;
          return [order, ...prev];
        });
      }
    });

    socket.on('order_status_update', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => socket.disconnect();
  }, [session]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={24} color="#a0a0a5" />;
      case 'preparing': return <ChefHat size={24} color="var(--primary)" />;
      case 'ready': return <CheckCircle2 size={24} color="var(--success)" />;
      case 'paid': return <CheckCircle2 size={24} color="var(--success)" />;
      default: return <Clock size={24} color="#a0a0a5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Aguardando Cozinha';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Servir';
      case 'paid': return 'Pedido Pago';
      default: return status;
    }
  };

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Carregando seus pedidos...</div>;
  }

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="flex justify-between items-center mb-6">
        <h2>Meus Pedidos</h2>
        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
          + Novo Pedido
        </button>
      </header>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
          <p>Nenhum pedido realizado ainda nesta mesa.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Ver Cardápio</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ borderLeft: order.status === 'paid' ? '4px solid var(--success)' : '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusIcon(order.status)}
                  <div>
                    <span className="font-bold block" style={{ fontSize: '1rem' }}>{getStatusText(order.status)}</span>
                    {order.comanda_number && (
                      <span className="text-sm text-primary" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Comanda: {order.comanda_number}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-muted text-sm">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span style={{ color: 'var(--text-main)' }}>{item.quantity}x {item.product?.name || 'Item'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold text-lg" style={{ paddingTop: '8px', borderTop: '1px dotted var(--border)' }}>
                <span>Total</span>
                <span className="text-primary">R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
