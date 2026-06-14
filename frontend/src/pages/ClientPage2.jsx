import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, Star, Flame, Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientPage2() {
  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [weeklyHighlights, setWeeklyHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Chamar Garçom Modal
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem('clientTableNumber') || '');
  const [callingWaiter, setCallingWaiter] = useState(false);

  // Menu Lateral State
  const [showSidebar, setShowSidebar] = useState(false);

  // Auto-slide Carrossel
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners]);

  // Carregar dados
  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then(res => res.json()),
      fetch('/api/products/featured').then(res => res.json()),
      fetch('/api/banners').then(res => res.json())
    ])
      .then(([menuData, featuredData, bannerData]) => {
        setCategories(Array.isArray(menuData) ? menuData : []);
        setWeeklyHighlights(Array.isArray(featuredData) ? featuredData : []);
        setBanners(Array.isArray(bannerData) ? bannerData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCallWaiter = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;
    
    setCallingWaiter(true);
    try {
      const res = await fetch('/api/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: tableNumber })
      });
      
      if (res.ok) {
        localStorage.setItem('clientTableNumber', tableNumber);
        toast.success('Garçom chamado com sucesso! Ele estará na sua mesa em breve.');
        setShowWaiterModal(false);
      } else {
        toast.error('Erro ao chamar o garçom. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao chamar garçom.');
    }
    setCallingWaiter(false);
  };

  return (
    <div style={{ backgroundColor: '#511F26', color: '#D0BAAA', minHeight: '100vh', fontFamily: 'Georgia, serif', backgroundImage: 'radial-gradient(#212322 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', paddingBottom: '0px' }}>
      
      {/* HEADER RÚSTICO/SOFISTICADO */}
      <header style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '4px double #212322', background: 'rgba(33, 35, 34, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', zIndex: 10 }}>
        
        {/* BOTÃO DO MENU LATERAL */}
        <button 
          onClick={() => setShowSidebar(true)}
          style={{ position: 'absolute', top: '25px', left: '20px', background: 'transparent', border: 'none', color: '#D0BAAA', cursor: 'pointer', zIndex: 11, padding: '5px' }}
        >
          <Menu size={32} />
        </button>

        {/* LOGO ADICIONADA AQUI */}
        <img 
          src="/logo.png" 
          alt="Vino Della Collina Bianco" 
          style={{ 
            height: '140px', 
            margin: '0 auto 5px', 
            display: 'block', 
            /* Filtro para transformar a logo preta em branca/bege clara para destacar no fundo escuro */
            filter: 'brightness(0) invert(1) drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) opacity(0.9)' 
          }} 
        />
        <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#B5B4A2', letterSpacing: '1px' }}>— Experiência Gastronômica —</p>
        
        <button 
          onClick={() => setShowWaiterModal(true)}
          style={{ marginTop: '25px', background: '#511F26', color: '#F2EEDF', border: '1px solid #C0AAB1', padding: '10px 25px', borderRadius: '0', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s' }}>
          <BellRing size={18} /> Chamar Garçom
        </button>
      </header>

      {/* CARROSSEL DE BANNERS ESTILO RÚSTICO 100% TELA */}
      {banners.length > 0 && (
        <div style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden' }}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: index === currentSlide ? 1 : 0, transition: 'opacity 0.8s ease-in-out',
                backgroundImage: `url(${banner.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(33, 35, 34, 1) 0%, rgba(33, 35, 34, 0.4) 50%, transparent 100%)' }}></div>
              <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', textAlign: 'center', zIndex: 3, padding: '0 20px' }}>
                {banner.badge && (
                  <span style={{ background: '#511F26', color: '#F2EEDF', padding: '6px 14px', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', display: 'inline-block', border: '1px solid #C0AAB1' }}>
                    {banner.badge}
                  </span>
                )}
                <h3 style={{ fontSize: '2.2rem', color: '#F2EEDF', margin: '0 0 10px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{banner.title}</h3>
                {banner.subtitle && (
                  <p style={{ fontSize: '1.1rem', color: '#D0BAAA', fontStyle: 'italic', margin: 0, textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{banner.subtitle}</p>
                )}
              </div>
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: '15px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 3 }}>
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{ width: '12px', height: '12px', borderRadius: '50%', background: index === currentSlide ? '#F2EEDF' : 'rgba(192, 170, 177, 0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
              ></button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '30px 20px', background: 'rgba(33, 35, 34, 0.85)', minHeight: '100vh' }}>



        {/* DESTAQUES DA SEMANA */}
        {weeklyHighlights.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', gap: '10px' }}>
               <Flame size={20} color="#511F26" />
               <h2 style={{ fontSize: '1.5rem', color: '#F2EEDF', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>Destaques</h2>
               <Flame size={20} color="#511F26" />
            </div>
            
            <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '20px', scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>
              {weeklyHighlights.map(product => (
                <div key={product.id} onClick={() => navigate(`/product/${product.id}`, { state: { product } })} style={{ flex: '0 0 260px', background: '#212322', border: '1px solid #3D312A', padding: '15px', cursor: 'pointer', transition: 'transform 0.3s', boxShadow: '3px 3px 10px rgba(0,0,0,0.3)' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={product.name} style={{ width: '100%', height: '160px', objectFit: 'cover', border: '2px solid #3D312A', filter: 'sepia(10%)' }} />
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#511F26', color: '#F2EEDF', padding: '4px 8px', fontSize: '0.7rem', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #C0AAB1' }}>
                      <Star size={12} fill="#F2EEDF" /> Destaque
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', color: '#D0BAAA', marginTop: '15px', marginBottom: '8px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#B5B4A2', fontStyle: 'italic', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.card_message || 'Toque para ver detalhes'}</p>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#C0AAB1', fontFamily: '"Outfit", sans-serif' }}>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILTRO DE CATEGORIAS RÚSTICO */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            <button 
              onClick={() => setSelectedCategory('all')} 
              style={{ background: selectedCategory === 'all' ? '#511F26' : 'transparent', border: '1px solid #511F26', color: selectedCategory === 'all' ? '#F2EEDF' : '#D0BAAA', padding: '8px 20px', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.3s' }}>
              Menu Completo
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)} 
                style={{ background: selectedCategory === cat.id ? '#511F26' : 'transparent', border: '1px solid #511F26', color: selectedCategory === cat.id ? '#F2EEDF' : '#D0BAAA', padding: '8px 20px', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.3s' }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA DO MENU ESTILO CARDÁPIO FÍSICO */}
        <div>
          {loading ? <p style={{ textAlign: 'center', color: '#C0AAB1', fontSize: '1.2rem', fontStyle: 'italic' }}>Folheando o cardápio...</p> : 
            categories.filter(cat => selectedCategory === 'all' || selectedCategory === cat.id).map(cat => (
              <div key={cat.id} style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                   <h3 style={{ fontSize: '1.4rem', color: '#F2EEDF', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{cat.name}</h3>
                   <button onClick={() => navigate(`/category/${cat.id}`, { state: { category: cat } })} style={{ background: 'transparent', border: '1px solid #511F26', color: '#D0BAAA', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.3s' }}>Ver mais</button>
                </div>
                
                <div className="product-grid">
                  {cat.products.map(product => (
                    <div key={product.id} onClick={() => navigate(`/product/${product.id}`, { state: { product } })} className="rustic-card" style={{ background: '#212322', border: '1px solid #511F26', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s', position: 'relative', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}>
                      {/* Elementos decorativos nos cantos */}
                      <div style={{ position: 'absolute', top: '5px', left: '5px', width: '10px', height: '10px', borderTop: '1px solid #C0AAB1', borderLeft: '1px solid #C0AAB1' }}></div>
                      <div style={{ position: 'absolute', top: '5px', right: '5px', width: '10px', height: '10px', borderTop: '1px solid #C0AAB1', borderRight: '1px solid #C0AAB1' }}></div>
                      <div style={{ position: 'absolute', bottom: '5px', left: '5px', width: '10px', height: '10px', borderBottom: '1px solid #C0AAB1', borderLeft: '1px solid #C0AAB1' }}></div>
                      <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '10px', height: '10px', borderBottom: '1px solid #C0AAB1', borderRight: '1px solid #C0AAB1' }}></div>

                      {product.image_url && <img src={product.image_url} alt={product.name} style={{ width: '100%', objectFit: 'cover', marginBottom: '20px', border: '3px solid #3D312A', filter: 'sepia(20%)' }} />}
                      
                      <h4 style={{ color: '#D0BAAA', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.name}</h4>
                      <p style={{ fontSize: '1rem', color: '#B5B4A2', fontStyle: 'italic', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>{product.card_message || 'Toque para ver detalhes'}</p>
                      
                      <div style={{ marginTop: 'auto', borderTop: '1px dashed #511F26', width: '100%', paddingTop: '15px' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#C0AAB1', fontFamily: '"Outfit", sans-serif' }}>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* MODAL PARA CHAMAR GARÇOM */}
      {showWaiterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(33, 35, 34, 0.9)', backdropFilter: 'blur(5px)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '400px', padding: '30px', background: '#212322', border: '2px solid #511F26', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '5px', left: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
            <div style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', borderTop: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>
            <div style={{ position: 'absolute', bottom: '5px', left: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderLeft: '2px solid #C0AAB1' }}></div>
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '15px', height: '15px', borderBottom: '2px solid #C0AAB1', borderRight: '2px solid #C0AAB1' }}></div>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <BellRing size={40} color="#C0AAB1" style={{ margin: '0 auto 15px' }} />
              <h3 style={{ color: '#F2EEDF', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Serviço de Mesa</h3>
              <p style={{ fontSize: '0.95rem', color: '#B5B4A2', fontStyle: 'italic' }}>
                Por favor, informe o número da sua mesa para enviarmos o garçom.
              </p>
            </div>

            <form onSubmit={handleCallWaiter} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input
                  type="number"
                  placeholder="Nº da Mesa (Ex: 5)"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  style={{
                    width: '100%', padding: '16px', border: '1px solid #3D312A', background: '#1a1b1b',
                    color: '#F2EEDF', fontSize: '1.2rem', outline: 'none', textAlign: 'center', fontFamily: '"Outfit", sans-serif'
                  }}
                  required
                />
              </div>

              <button type="submit" disabled={callingWaiter} style={{ padding: '16px', fontSize: '1.1rem', background: '#511F26', color: '#F2EEDF', border: '1px solid #C0AAB1', cursor: 'pointer', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                {callingWaiter ? 'Chamando...' : 'Confirmar Chamado'}
              </button>

              <button
                type="button"
                onClick={() => setShowWaiterModal(false)}
                style={{ background: 'transparent', borderColor: 'transparent', color: '#B5B4A2', padding: '10px', cursor: 'pointer', fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem', textDecoration: 'underline' }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR DE CATEGORIAS */}
      {showSidebar && (
        <>
          {/* Overlay escuro */}
          <div 
            onClick={() => setShowSidebar(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(2px)' }}
          ></div>
          
          {/* Barra Lateral */}
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#212322', borderRight: '2px solid #511F26', zIndex: 1000, boxShadow: '5px 0 20px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #3D312A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#F2EEDF', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, fontFamily: '"Outfit", sans-serif' }}>Cardápio</h2>
              <button onClick={() => setShowSidebar(false)} style={{ background: 'transparent', border: 'none', color: '#C0AAB1', cursor: 'pointer', padding: '5px' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => { 
                  setSelectedCategory('all'); 
                  setShowSidebar(false); 
                  window.scrollTo({ top: 800, behavior: 'smooth' }); 
                }}
                style={{ background: selectedCategory === 'all' ? '#511F26' : 'transparent', color: selectedCategory === 'all' ? '#F2EEDF' : '#D0BAAA', border: '1px solid #3D312A', padding: '12px', textAlign: 'left', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', cursor: 'pointer', transition: '0.3s' }}
              >
                Menu Completo
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => { 
                    setShowSidebar(false); 
                    navigate(`/category/${cat.id}`, { state: { category: cat } });
                  }}
                  style={{ background: selectedCategory === cat.id ? '#511F26' : 'transparent', color: selectedCategory === cat.id ? '#F2EEDF' : '#D0BAAA', border: '1px solid #3D312A', padding: '12px', textAlign: 'left', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', cursor: 'pointer', transition: '0.3s' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
