import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Product() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.product) return <Navigate to="/" />;
  const product = state.product;

  return (
    <div style={{ backgroundColor: '#3D312A', color: '#D0BAAA', minHeight: '100vh', fontFamily: 'Georgia, serif', backgroundImage: 'radial-gradient(#511F26 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', paddingBottom: '100px' }}>
      
      <div style={{ padding: '40px 20px', background: 'rgba(61, 49, 42, 0.85)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', background: '#212322', padding: '50px', border: '1px solid #511F26', position: 'relative', boxShadow: '5px 5px 25px rgba(0,0,0,0.4)' }}>
          
          {/* Elementos decorativos nos cantos */}
          <div style={{ position: 'absolute', top: '5px', left: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', bottom: '5px', left: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>

          {/* ROW 1: IMAGEM + DESCRIÇÃO */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
            
            {/* COLUNA 1: IMAGEM */}
            {product.image_url && (
              <div style={{ flex: '1 1 400px', maxWidth: '600px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-12px', border: '1px dashed #511F26', zIndex: 0 }}></div>
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', border: '4px solid #3D312A', position: 'relative', zIndex: 1, filter: 'sepia(15%)', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} 
                />
              </div>
            )}

            {/* COLUNA 2: INFORMAÇÕES */}
            <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', height: '100%', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #511F26', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#F2EEDF', lineHeight: '1.2', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {product.name}
                </h2>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#C0AAB1', fontFamily: '"Outfit", sans-serif' }}>
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <h4 style={{ fontSize: '1.2rem', color: '#C0AAB1', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Apreciação</h4>
              <p style={{ fontSize: '1.1rem', color: '#B5B4A2', lineHeight: '1.8', marginBottom: '40px', fontStyle: 'italic' }}>
                {product.description || 'Nenhuma descrição detalhada disponível para esta especiaria.'}
              </p>
              
              <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
                <button 
                  onClick={() => navigate(-1)} 
                  style={{ padding: '14px 40px', fontSize: '1.1rem', background: 'transparent', border: '1px solid #C0AAB1', color: '#F2EEDF', cursor: 'pointer', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s' }}
                >
                  Retornar ao Cardápio
                </button>
              </div>
            </div>

          </div>

          {/* ROW 2: SUGESTÕES */}
          {product.suggestedProducts && product.suggestedProducts.length > 0 && (
            <div style={{ width: '100%', paddingTop: '40px', marginTop: '20px', borderTop: '1px dashed #511F26' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', gap: '15px' }}>
                 <div style={{ height: '1px', flex: 1, background: '#511F26', maxWidth: '80px' }}></div>
                 <h4 style={{ fontSize: '1.4rem', color: '#F2EEDF', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>Harmoniza Com</h4>
                 <div style={{ height: '1px', flex: 1, background: '#511F26', maxWidth: '80px' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
                {product.suggestedProducts.map(suggestion => (
                  <div 
                    key={suggestion.id}
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate(`/product/${suggestion.id}`, { state: { product: suggestion } });
                    }}
                    style={{
                      minWidth: '200px', maxWidth: '240px', cursor: 'pointer',
                      background: '#1A1614', padding: '15px',
                      border: '1px solid #3D312A', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                      transition: 'transform 0.3s, border-color 0.3s', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.borderColor = '#511F26';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = '#3D312A';
                    }}
                  >
                    {suggestion.image_url ? (
                      <img src={suggestion.image_url} alt={suggestion.name} style={{ width: '100%', height: '140px', objectFit: 'cover', border: '2px solid #2C2522', marginBottom: '15px', filter: 'sepia(15%)' }} />
                    ) : (
                      <div style={{ width: '100%', height: '140px', background: '#212322', border: '2px solid #2C2522', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A69B91', fontSize: '0.9rem', fontStyle: 'italic' }}>Sem foto</div>
                    )}
                    <h5 style={{ fontSize: '1.1rem', color: '#D0BAAA', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{suggestion.name}</h5>
                    <span style={{ fontSize: '1.1rem', color: '#C0AAB1', fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>R$ {suggestion.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
