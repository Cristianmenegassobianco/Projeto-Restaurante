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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border)' }}>
        
        {/* ROW 1: IMAGEM + DESCRIÇÃO */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
          
          {/* COLUNA 1: IMAGEM */}
          {product.image_url && (
            <div style={{ flex: '1 1 300px', maxWidth: '450px' }}>
              <img 
                src={product.image_url} 
                alt={product.name} 
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
              />
            </div>
          )}

          {/* COLUNA 2: INFORMAÇÕES */}
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

        {/* ROW 2: SUGESTÕES OCUPANDO A LARGURA TOTAL */}
        {product.suggestedProducts && product.suggestedProducts.length > 0 && (
          <div style={{ width: '100%', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '16px' }}>Combina Perfeitamente Com:</h4>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
              {product.suggestedProducts.map(suggestion => (
                <div 
                  key={suggestion.id}
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(`/product/${suggestion.id}`, { state: { product: suggestion } });
                  }}
                  style={{
                    minWidth: '180px', maxWidth: '220px', cursor: 'pointer',
                    background: 'var(--bg-dark)', borderRadius: '12px', padding: '12px',
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {suggestion.image_url ? (
                    <img src={suggestion.image_url} alt={suggestion.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '100%', height: '120px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem foto</div>
                  )}
                  <h5 style={{ fontSize: '1rem', color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suggestion.name}</h5>
                  <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>R$ {suggestion.price.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
