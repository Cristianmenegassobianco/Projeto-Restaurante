import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Product() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.product) return <Navigate to="/" />;
  const product = state.product;

  let parsedSizes = [];
  try {
    parsedSizes = product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [];
  } catch(e) {}

  return (
    <div style={{ backgroundColor: '#3D312A', color: '#D0BAAA', minHeight: '100vh', fontFamily: 'Georgia, serif', backgroundImage: 'radial-gradient(#511F26 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', paddingBottom: '0px' }}>
      
      <div className="product-container">
        <div className="product-card">
          
          {/* Elementos decorativos nos cantos */}
          <div style={{ position: 'absolute', top: '5px', left: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', bottom: '5px', left: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
          <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>

          {/* ROW 1: IMAGEM + DESCRIÇÃO */}
          <div className="product-layout">
            
            {/* COLUNA 1: IMAGEM */}
            {product.image_url && (
              <div className="product-image-wrapper">
                <div className="product-image-bg-dashed"></div>
                
                <div className="product-gallery-layout">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    loading="lazy"
                    className="product-main-image"
                  />
                </div>
              </div>
            )}

            {/* COLUNA 2: INFORMAÇÕES */}
            <div className="product-info-wrapper">
              <div className="product-header">
                <h2 className="product-title">
                  {product.name}
                </h2>
                {parsedSizes.length === 0 && (
                  <span className="product-price">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {parsedSizes.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.2rem', color: '#C0AAB1', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tamanhos / Porções</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {parsedSizes.map((size, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted #511F26', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '1.1rem', color: '#F2EEDF' }}>{size.name}</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C0AAB1', fontFamily: '"Outfit", sans-serif' }}>R$ {parseFloat(size.price).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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
                    className="product-suggestion-item"
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
                      <img src={suggestion.image_url} alt={suggestion.name} loading="lazy" style={{ width: '100%', height: '140px', objectFit: 'cover', border: '2px solid #2C2522', marginBottom: '15px', filter: 'sepia(15%)' }} />
                    ) : (
                      <div style={{ width: '100%', height: '140px', background: '#212322', border: '2px solid #2C2522', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A69B91', fontSize: '0.9rem', fontStyle: 'italic' }}>Sem foto</div>
                    )}
                    <h5 className="product-suggestion-title">{suggestion.name}</h5>
                    <span className="product-suggestion-price">R$ {suggestion.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* FOOTER DESENVOLVIDO POR */}
      <footer style={{ 
        padding: '30px 20px', 
        marginTop: '0', 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '20px', 
        zIndex: 10, 
        position: 'relative', 
        flexWrap: 'wrap',
        background: 'rgba(33, 35, 34, 0.95)',
        borderTop: '4px double #511F26',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)'
      }}>
         <span style={{ color: '#D0BAAA', fontSize: '1rem', fontStyle: 'italic', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: '"Outfit", sans-serif' }}>Desenvolvido por</span>
         <img src="/serve-master.png" alt="Serve Master Premium Eatery Services" loading="lazy" style={{ height: '140px', marginTop: '-60px', marginBottom: '0', objectFit: 'contain', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))' }} />
      </footer>
    </div>
  );
}
