import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function Category() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState(location.state?.category || null);
  const [loading, setLoading] = useState(!category);

  useEffect(() => {
    if (!category) {
      // Se não veio do state (ex: recarregou a página), busca na API
      setLoading(true);
      fetch('/api/menu')
        .then(res => res.json())
        .then(data => {
          const cat = data.categories?.find(c => c.id === id || c.id === parseInt(id));
          if (cat) {
            setCategory(cat);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, category]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#212322', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0AAB1' }}>
        <p style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>Organizando o cardápio...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ backgroundColor: '#212322', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F2EEDF' }}>
        <h2>Categoria não encontrada.</h2>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#511F26', color: '#F2EEDF', border: 'none', cursor: 'pointer' }}>Voltar ao Início</button>
      </div>
    );
  }

  // Ordena os produtos em ordem alfabética
  const sortedProducts = [...category.products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ backgroundColor: '#212322', color: '#D0BAAA', minHeight: '100vh', fontFamily: 'Georgia, serif', backgroundImage: 'radial-gradient(#511F26 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', paddingBottom: '60px' }}>
      <div style={{ padding: '30px 20px', background: 'rgba(33, 35, 34, 0.85)', minHeight: '100vh' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '15px' }}>
           <div style={{ height: '1px', flex: 1, background: '#511F26', maxWidth: '100px' }}></div>
           <h2 style={{ fontSize: '1.6rem', color: '#F2EEDF', textTransform: 'uppercase', letterSpacing: '4px', margin: 0, textAlign: 'center' }}>
             {category.name}
           </h2>
           <div style={{ height: '1px', flex: 1, background: '#511F26', maxWidth: '100px' }}></div>
        </div>

        <div className="category-grid">
          {sortedProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => navigate(`/product/${product.id}`, { state: { product } })} 
              style={{ background: '#212322', border: '1px solid #511F26', padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s', position: 'relative', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}
            >
              {/* Elementos decorativos nos cantos */}
              <div style={{ position: 'absolute', top: '5px', left: '5px', width: '10px', height: '10px', borderTop: '1px solid #C0AAB1', borderLeft: '1px solid #C0AAB1' }}></div>
              <div style={{ position: 'absolute', top: '5px', right: '5px', width: '10px', height: '10px', borderTop: '1px solid #C0AAB1', borderRight: '1px solid #C0AAB1' }}></div>
              <div style={{ position: 'absolute', bottom: '5px', left: '5px', width: '10px', height: '10px', borderBottom: '1px solid #C0AAB1', borderLeft: '1px solid #C0AAB1' }}></div>
              <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '10px', height: '10px', borderBottom: '1px solid #C0AAB1', borderRight: '1px solid #C0AAB1' }}></div>

              {product.image_url && (
                <img src={product.image_url} alt={product.name} loading="lazy" style={{ width: '100%', height: '130px', objectFit: 'cover', marginBottom: '15px', border: '3px solid #3D312A', filter: 'sepia(20%)' }} />
              )}
              
              <h4 style={{ fontSize: '1.1rem', color: '#D0BAAA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.name}</h4>
              <p style={{ fontSize: '0.85rem', color: '#B5B4A2', fontStyle: 'italic', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>{product.card_message || 'Toque para ver detalhes'}</p>
              
              <div style={{ marginTop: 'auto', borderTop: '1px dashed #511F26', width: '100%', paddingTop: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#C0AAB1', fontFamily: '"Outfit", sans-serif' }}>R$ {product.price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
