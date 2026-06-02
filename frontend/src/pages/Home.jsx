import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  UtensilsCrossed,
  BellRing,
  Star,
  Flame,
} from 'lucide-react';

export default function Home() {
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
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(err => console.error(err));

    // 2. Carregar destaques
    fetch('/api/products/featured')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWeeklyHighlights(data);
        } else {
          setWeeklyHighlights([]);
        }
      })
      .catch(err => console.error(err));

    // 3. Carregar banners
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else {
          setBanners([]);
        }
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
        alert('Garçom chamado com sucesso! Ele estará na sua mesa em breve.');
        setShowWaiterModal(false);
      } else {
        alert('Erro ao chamar o garçom. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao chamar garçom.');
    }
    setCallingWaiter(false);
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
          <button
            onClick={() => setShowWaiterModal(true)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(242, 133, 0, 0.3)'
            }}
          >
            <BellRing size={16} />
            Chamar Garçom
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

      {/* MODAL PARA CHAMAR GARÇOM */}
      {showWaiterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-card)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <BellRing size={48} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Chamar Garçom</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Informe o número da sua mesa para que o garçom vá até você.
              </p>
            </div>

            <form onSubmit={handleCallWaiter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="number"
                  placeholder="Nº da Mesa (Ex: 5)"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-dark)',
                    color: 'white', fontSize: '1.1rem', outline: 'none', textAlign: 'center'
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={callingWaiter} style={{ padding: '14px', fontSize: '1.1rem' }}>
                {callingWaiter ? 'Chamando...' : 'Confirmar Chamado'}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowWaiterModal(false)}
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', padding: '14px' }}
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
