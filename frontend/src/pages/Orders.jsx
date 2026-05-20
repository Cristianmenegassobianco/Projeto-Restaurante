import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { io } from 'socket.io-client';
import { Clock, CheckCircle2, ChefHat } from 'lucide-react';

export default function Orders() {
  const session = useStore(s => s.session);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  // Em um cenário real faríamos um fetch inicial dos pedidos desta sessão.
  // Para simplificar, vamos escutar o socket.

  useEffect(() => {
    const socket = io('http://localhost:3000');
    
    socket.on('new_order', (order) => {
      if (order.table_session_id === session?.session_id) {
        setOrders(prev => [order, ...prev]);
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
      default: return <Clock size={24} color="#a0a0a5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Aguardando Cozinha';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Servir';
      default: return status;
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
          <p>Nenhum pedido realizado ainda.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/menu')}>Voltar ao Cardápio</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusIcon(order.status)}
                  <span className="font-bold">{getStatusText(order.status)}</span>
                </div>
                <span className="text-muted text-sm">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.product?.name || 'Produto'}</span>
                    <span>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold text-lg">
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
