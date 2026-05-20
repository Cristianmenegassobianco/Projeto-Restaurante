import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Cart() {
  const { cart, removeFromCart, clearCart, session } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          total_amount: total,
          items: cart.map(i => ({
            product_id: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
            notes: i.notes
          }))
        })
      });

      if (res.ok) {
        clearCart();
        alert('Pedido enviado com sucesso para a cozinha!');
        // Navega para a página de acompanhamento
        navigate('/orders');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Sua comanda está vazia</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/menu')}>
          Ver Cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cart.map((item, idx) => (
          <div key={idx} className="card flex gap-4" style={{ position: 'relative' }}>
            {item.product.image_url && (
              <img 
                src={item.product.image_url} 
                alt={item.product.name} 
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div className="flex justify-between">
                <h4 style={{ fontSize: '1rem', width: '80%' }}>{item.quantity}x {item.product.name}</h4>
                <button 
                  onClick={() => removeFromCart(item.product.id, item.notes)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              {item.notes && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px' }}>{item.notes}</p>}
              <div className="font-bold mt-2">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '600px', padding: '16px 20px',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        zIndex: 100
      }}>
        <div className="flex justify-between mb-4 text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
        <button className="btn btn-primary" onClick={handleCheckout} disabled={loading}>
          {loading ? 'Enviando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}
