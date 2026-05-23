import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { 
  QrCode, 
  UtensilsCrossed, 
  ShoppingBag, 
  ChevronRight, 
  Star, 
  Flame, 
  PlusCircle, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';

export default function Home() {
  const session = useStore(state => state.session);
  const setSession = useStore(state => state.setSession);
  const cart = useStore(state => state.cart);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [weeklyHighlights, setWeeklyHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal de Mesa
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [loadingSession, setLoadingSession] = useState(false);

  // Auto-slide Carrossel
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners]);

  // Carregar cardápio, destaques e banners
  useEffect(() => {
    // 1. Carregar cardápio completo
    fetch('/api/menu')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar cardápio');
        return res.json();
      })
      .then(data => {
        setCategories(data);
      })
      .catch(err => console.error(err));

    // 2. Carregar destaques
    fetch('/api/products/featured')
      .then(res => res.json())
      .then(data => {
        setWeeklyHighlights(data);
      })
      .catch(err => console.error(err));

    // 3. Carregar banners
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        setBanners(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Iniciar sessão da mesa
  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;
    setLoadingSession(true);
    try {
      const res = await fetch('/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: parseInt(tableNumber) })
      });
      const data = await res.json();
      if (data.token) {
        setSession(data);
        setShowTableModal(false);
      } else {
        alert('Erro ao iniciar sessão.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede.');
    }
    setLoadingSession(false);
  };

  // Alternar ou configurar mesa
  const handleTableBadgeClick = () => {
    if (session) {
      if (window.confirm(`Deseja encerrar ou trocar a Mesa ${session.table_number}?`)) {
        setSession(null);
        setTableNumber('');
        setShowTableModal(true);
      }
    } else {
      setShowTableModal(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* HEADER DE NAVEGAÇÃO SUPERIOR */}
      <header className="header" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UtensilsCrossed size={22} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: 1.1 }}>Gourmet</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Express App</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Badge de Mesa */}
          <button 
            onClick={handleTableBadgeClick}
            style={{
              background: session ? 'rgba(46, 213, 115, 0.15)' : 'rgba(242, 133, 0, 0.15)',
              border: `1px solid ${session ? 'var(--success)' : 'var(--primary)'}`,
              color: session ? 'var(--success)' : 'var(--primary)',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: session ? 'var(--success)' : 'var(--primary)',
              display: 'inline-block'
            }}></span>
            {session ? `Mesa ${session.table_number}` : 'Definir Mesa'}
          </button>

          {/* Carrinho de Compras */}
          <button 
            onClick={() => session ? navigate('/cart') : setShowTableModal(true)} 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-main)', 
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <ShoppingBag size={20} />
            {cartItemsCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: 'var(--primary)', color: 'white',
                borderRadius: '50%', width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold'
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <div className="container" style={{ padding: '20px 20px 0 20px' }}>
        
        {/* CARROSSEL DE BANNERS */}
        <div className="banner-carousel">
          {banners.length > 0 ? (
            banners.map((banner, index) => (
              <div 
                key={banner.id}
                className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${banner.image_url})` }}
              >
                <div className="banner-overlay"></div>
                <div className="banner-content">
                  {banner.badge && (
                    <span style={{
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      display: 'inline-block'
                    }}>
                      {banner.badge}
                    </span>
                  )}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p style={{ fontSize: '0.85rem', color: '#e0e0e0' }}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Nenhum banner cadastrado
            </div>
          )}

          {/* Dots do Carrossel */}
          <div className="carousel-dots">
            {banners.map((_, index) => (
              <button 
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}
          </div>
        </div>

        {/* PRODUTOS DA SEMANA (HIGHLIGHTS) */}
        <section style={{ marginBottom: '32px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="var(--primary)" />
              <span>Destaques da Semana</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deslize →</span>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando destaques...</div>
          ) : (
            <div className="horizontal-scroll">
              {weeklyHighlights.map(product => (
                <div 
                  key={product.id}
                  className="highlight-card"
                  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
                      alt={product.name}
                      style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(10, 10, 12, 0.75)', backdropFilter: 'blur(4px)',
                      color: 'var(--primary)', padding: '4px 8px', borderRadius: '12px',
                      fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Star size={12} fill="var(--primary)" /> Destaque
                    </span>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '8px' }}>
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary" style={{ fontSize: '1rem' }}>
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                      <PlusCircle size={18} color="var(--primary)" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FILTRO DE CATEGORIAS */}
        <section style={{ marginBottom: '24px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Nosso Cardápio</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }}>
            <button 
              className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* LISTA COMPLETA DO MENU */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)' }}>
              Carregando cardápio...
            </div>
          ) : (
            categories
              .filter(cat => selectedCategory === 'all' || selectedCategory === cat.id)
              .map(category => (
                <div key={category.id}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    {category.name}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {category.products.map(product => (
                      <div 
                        key={product.id}
                        className="card flex gap-4"
                        style={{ cursor: 'pointer', padding: '12px', alignItems: 'center' }}
                        onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                      >
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '80px' }}>
                          <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '2px', color: 'white' }}>
                              {product.name}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {product.description}
                            </p>
                          </div>
                          <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
                            <span className="font-bold" style={{ fontSize: '0.95rem', color: 'white' }}>
                              R$ {product.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                              Pedir <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </section>

      </div>

      {/* FOOTER FIXO (OPÇÕES DE NAVEGAÇÃO DE SESSÃO) */}
      {session && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '600px', padding: '12px 20px',
          background: 'rgba(24, 24, 28, 0.9)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px', zIndex: 100
        }}>
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/orders')}
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem', display: 'flex', gap: '8px' }}
          >
            <CheckCircle2 size={18} color="var(--success)" />
            Ver Pedidos
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/cart')}
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem', display: 'flex', gap: '8px' }}
          >
            <ShoppingBag size={18} />
            Minha Comanda ({cartItemsCount})
          </button>
        </div>
      )}

      {/* MODAL PARA DEFINIR A MESA */}
      {showTableModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-card)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <QrCode size={48} color="var(--primary)" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Iniciar Sessão na Mesa</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Digite o número da sua mesa para liberar o pedido e adicionar produtos ao carrinho.
              </p>
            </div>
            
            <form onSubmit={handleSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Número da Mesa
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 5" 
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-dark)',
                    color: 'white', fontSize: '1rem', outline: 'none', textAlign: 'center'
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loadingSession}>
                {loadingSession ? 'Iniciando...' : 'Acessar e Pedir'}
              </button>

              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowTableModal(false)}
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
