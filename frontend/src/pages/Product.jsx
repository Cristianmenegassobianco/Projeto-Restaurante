import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
export default function Product() {
  const { state } = useLocation();
  const navigate = useNavigate();


  if (!state?.product) return <Navigate to="/" />;
  const product = state.product;

  return (
    <div className="container" style={{ padding: '40px 20px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start', background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border)' }}>
        
        {/* IMAGEM NA LATERAL */}
        {product.image_url && (
          <div style={{ flex: '1 1 300px', maxWidth: '450px' }}>
            <img 
              src={product.image_url} 
              alt={product.name} 
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
            />
          </div>
        )}

        {/* INFORMAÇÕES DO LADO */}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0, color: 'white', lineHeight: '1.1' }}>
              {product.name}
            </h2>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(242, 133, 0, 0.1)', padding: '8px 16px', borderRadius: '12px' }}>
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <h4 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '8px' }}>Descrição do Produto</h4>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '40px' }}>
            {product.description || 'Nenhuma descrição detalhada disponível para este produto.'}
          </p>
          
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => navigate(-1)} 
              style={{ padding: '14px 32px', fontSize: '1.05rem' }}
            >
              ← Voltar ao Cardápio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
