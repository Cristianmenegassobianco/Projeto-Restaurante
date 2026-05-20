import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import useStore from '../store/useStore';

export default function Header({ title, showBack = false, showCart = false }) {
  const navigate = useNavigate();
  const cart = useStore(state => state.cart);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="header">
      <div style={{ width: '40px' }}>
        {showBack && (
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      
      <h2 style={{ fontSize: '1.2rem', textAlign: 'center', flex: 1 }}>{title}</h2>
      
      <div style={{ width: '40px', position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
        {showCart && (
          <button onClick={() => navigate('/cart')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ShoppingBag size={24} />
            {cartItemsCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: 'var(--primary)', color: 'white',
                borderRadius: '50%', width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
