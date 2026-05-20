import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import useStore from '../store/useStore';

export default function Product() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const addToCart = useStore(s => s.addToCart);
  
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!state?.product) return <Navigate to="/menu" />;
  const product = state.product;

  const handleAdd = () => {
    addToCart(product, quantity, notes);
    navigate(-1); // Volta para o cardápio
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '100px' }}>
      {product.image_url && (
        <img 
          src={product.image_url} 
          alt={product.name} 
          style={{ width: '100%', height: '300px', objectFit: 'cover' }} 
        />
      )}
      
      <div className="container" style={{ marginTop: '-20px', borderRadius: '24px 24px 0 0', background: 'var(--bg-dark)', zIndex: 10 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.5rem', width: '70%' }}>{product.name}</h2>
          <span className="text-primary font-bold text-xl">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
        
        <p style={{ marginBottom: '24px', fontSize: '1rem' }}>{product.description}</p>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
            Observações
          </label>
          <textarea 
            placeholder="Ex: Tirar cebola, ponto da carne..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'white', minHeight: '80px', outline: 'none'
            }}
          />
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '600px', padding: '16px 20px',
          background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '16px', zIndex: 100
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'var(--bg-dark)', borderRadius: '8px', padding: '4px 8px' 
          }}>
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px', cursor: 'pointer' }}
            >
              <Minus size={20} />
            </button>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px', cursor: 'pointer' }}
            >
              <Plus size={20} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleAdd} style={{ flex: 1 }}>
            Adicionar • R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
          </button>
        </div>
      </div>
    </div>
  );
}
