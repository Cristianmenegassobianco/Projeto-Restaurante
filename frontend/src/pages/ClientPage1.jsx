import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ChevronRight, Utensils } from 'lucide-react';

export default function ClientPage1() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ backgroundColor: '#212322', color: '#F2EEDF', minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>
      
      {/* HEADER ELEGANTE */}
      <header style={{ padding: '30px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3D312A', background: 'linear-gradient(180deg, #1a1b1b 0%, #212322 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#511F26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Utensils size={20} color="#F2EEDF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '600', letterSpacing: '1.5px', color: '#D0BAAA', margin: 0 }}>GOURMET</h1>
            <p style={{ fontSize: '0.75rem', color: '#B5B4A2', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Express</p>
          </div>
        </div>
        <button style={{ background: '#3D312A', border: '1px solid #511F26', color: '#D0BAAA', borderRadius: '30px', padding: '10px 18px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
          <BellRing size={16} /> Garçom
        </button>
      </header>

      {/* HERO SECTION */}
      <div style={{ padding: '50px 25px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(81,31,38,0.2) 0%, rgba(33,35,34,0) 70%)', borderRadius: '50%' }}></div>
        <h2 style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '15px', lineHeight: '1.1', color: '#F2EEDF' }}>
          A arte <br/>
          <span style={{ fontStyle: 'italic', color: '#D0BAAA', fontWeight: '400' }}>de saborear.</span>
        </h2>
        <p style={{ color: '#B5B4A2', fontSize: '1rem', maxWidth: '80%' }}>Explore nossa seleção exclusiva com ingredientes selecionados.</p>
      </div>

      <div style={{ padding: '0 25px 50px' }}>
        {/* FILTRO MINIMALISTA COM SCROLL */}
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '30px', scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedCategory('all')} style={{ background: selectedCategory === 'all' ? '#511F26' : 'transparent', border: selectedCategory === 'all' ? 'none' : '1px solid #3D312A', color: selectedCategory === 'all' ? '#F2EEDF' : '#B5B4A2', padding: '10px 24px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.3s' }}>
            Todos
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ background: selectedCategory === cat.id ? '#511F26' : 'transparent', border: selectedCategory === cat.id ? 'none' : '1px solid #3D312A', color: selectedCategory === cat.id ? '#F2EEDF' : '#B5B4A2', padding: '10px 24px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.3s' }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* LISTA DE PRODUTOS ELEGANTE */}
        <div>
          {loading ? <p style={{ color: '#B5B4A2', textAlign: 'center' }}>Preparando o cardápio...</p> : 
            categories.filter(cat => selectedCategory === 'all' || selectedCategory === cat.id).map(cat => (
              <div key={cat.id} style={{ marginBottom: '50px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '500', marginBottom: '25px', color: '#D0BAAA', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {cat.name}
                  <div style={{ height: '1px', flex: 1, background: '#3D312A' }}></div>
                </h3>
                {cat.products.map(product => (
                  <div key={product.id} onClick={() => navigate(`/product/${product.id}`, { state: { product } })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'linear-gradient(145deg, #242625 0%, #1d1e1e 100%)', borderRadius: '16px', marginBottom: '15px', border: '1px solid rgba(61,49,42, 0.5)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                    <div style={{ flex: 1, paddingRight: '15px' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '500', marginBottom: '8px', color: '#F2EEDF' }}>{product.name}</h4>
                      <p style={{ color: '#B5B4A2', fontSize: '0.85rem', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>{product.description}</p>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#D0BAAA' }}>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {product.image_url && (
                      <div style={{ position: 'relative' }}>
                        <img src={product.image_url} alt={product.name} style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: '#511F26', borderRadius: '50%', padding: '6px' }}>
                          <ChevronRight size={16} color="#F2EEDF" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          }
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
         <img src="/serve-master.png" alt="Serve Master Premium Eatery Services" style={{ height: '140px', marginTop: '-60px', marginBottom: '0', objectFit: 'contain', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))' }} />
      </footer>
    </div>
  );
}
