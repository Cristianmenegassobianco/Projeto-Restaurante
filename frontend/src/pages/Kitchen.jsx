import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Check, ChefHat, PlusCircle, Trash2, Image, Star, Edit, X } from 'lucide-react';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'add' | 'banners' | 'featured'

  // Banner state
  const [banners, setBanners] = useState([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImageUrl, setNewBannerImageUrl] = useState('');
  const [newBannerBadge, setNewBannerBadge] = useState('');
  const [bannerLoading, setBannerLoading] = useState(false);
  const [confirmDeleteBannerId, setConfirmDeleteBannerId] = useState(null);

  // Add Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductLoading, setEditProductLoading] = useState(false);

  // Add Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    // 1. Carregar pedidos iniciais
    fetch('/api/kitchen/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      })
      .catch(err => console.error(err));

    // 2. Conectar socket para pedidos em tempo real
    const socket = io(import.meta.env.VITE_API_URL || '', {
      path: '/socket.io'
    });
    
    socket.on('new_order', (order) => {
      setOrders(prev => [...prev, order]);
    });

    socket.on('order_status_update', (updatedOrder) => {
      if (updatedOrder.status === 'paid' || updatedOrder.status === 'canceled') {
        // Remover da fila de ativos
        setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      } else {
        // Atualizar status
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Carregar dados com base na aba ativa
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'add' || activeTab === 'featured') {
      fetchMenuAndCategories();
    }
    if (activeTab === 'banners') {
      fetchBanners();
    }
  }, [activeTab]);

  const fetchMenuAndCategories = async () => {
    try {
      const menuRes = await fetch('/api/admin/menu');
      const menuData = await menuRes.json();
      if (Array.isArray(menuData)) {
        setMenu(menuData);
      } else {
        setMenu([]);
      }

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        setCategories(catData);
        if (catData.length > 0 && !newProductCategoryId) {
          setNewProductCategoryId(catData[0].id);
        }
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar pedido');
    }
  };

  const toggleAvailability = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      } else {
        alert('Erro ao excluir produto.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Deseja realmente excluir esta categoria? Isso também excluirá todos os produtos dentro dela.')) return;
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMenuAndCategories();
      } else {
        alert('Erro ao excluir categoria.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName || !newProductCategoryId || !newProductPrice) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setFormLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          category_id: newProductCategoryId,
          price: parseFloat(newProductPrice),
          description: newProductDescription,
          image_url: newProductImageUrl
        })
      });

      if (res.ok) {
        alert('Produto adicionado com sucesso!');
        setNewProductName('');
        setNewProductPrice('');
        setNewProductDescription('');
        setNewProductImageUrl('');
        fetchMenuAndCategories();
        setActiveTab('products'); // Volta para a aba de produtos
      } else {
        alert('Erro ao adicionar produto.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao adicionar produto.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setEditProductLoading(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          category_id: editingProduct.category_id,
          price: parseFloat(editingProduct.price),
          description: editingProduct.description || '',
          image_url: editingProduct.image_url || ''
        })
      });

      if (res.ok) {
        alert('Produto atualizado com sucesso!');
        setEditingProduct(null);
        fetchMenuAndCategories();
      } else {
        alert('Erro ao atualizar produto.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao atualizar produto.');
    } finally {
      setEditProductLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setCategoryLoading(true);
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (res.ok) {
        alert('Categoria adicionada com sucesso!');
        setNewCategoryName('');
        fetchMenuAndCategories(); // Atualiza a lista
      } else {
        alert('Erro ao adicionar categoria.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao adicionar categoria.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBanners(data);
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImageUrl) {
      alert('Título e URL da imagem são obrigatórios.');
      return;
    }
    setBannerLoading(true);
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBannerTitle,
          subtitle: newBannerSubtitle,
          image_url: newBannerImageUrl,
          badge: newBannerBadge
        })
      });
      if (res.ok) {
        setNewBannerTitle('');
        setNewBannerSubtitle('');
        setNewBannerImageUrl('');
        setNewBannerBadge('');
        fetchBanners();
      } else {
        alert('Erro ao adicionar banner.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
    setBannerLoading(false);
  };

  const handleDeleteBanner = async (id) => {
    try {
      await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      setConfirmDeleteBannerId(null);
      fetchBanners();
    } catch (err) {
      console.error(err);
      alert('Erro ao remover banner.');
    }
  };

  const toggleFeatured = async (productId, currentValue) => {
    try {
      await fetch(`/api/products/${productId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentValue })
      });
      fetchMenuAndCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat color="var(--primary)" />
          Painel da Cozinha e Administração
        </h1>
        {activeTab === 'orders' && (
          <span style={{ padding: '4px 12px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '0.85rem' }}>
            {orders.length} Pedidos Ativos
          </span>
        )}
      </header>

      {/* ABAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('orders')}
          className="btn"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            background: activeTab === 'orders' ? 'var(--primary)' : 'var(--bg-card)',
            color: 'white', fontWeight: activeTab === 'orders' ? 'bold' : 'normal'
          }}
        >
          Fila de Pedidos ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className="btn"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            background: activeTab === 'products' ? 'var(--primary)' : 'var(--bg-card)',
            color: 'white', fontWeight: activeTab === 'products' ? 'bold' : 'normal'
          }}
        >
          Cardápio do Cliente
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          className="btn"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            background: activeTab === 'add' ? 'var(--primary)' : 'var(--bg-card)',
            color: 'white', fontWeight: activeTab === 'add' ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <PlusCircle size={16} />
          Adicionar Produto
        </button>
        <button 
          onClick={() => setActiveTab('banners')}
          className="btn"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            background: activeTab === 'banners' ? 'var(--primary)' : 'var(--bg-card)',
            color: 'white', fontWeight: activeTab === 'banners' ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Image size={16} />
          Banners
        </button>
        <button 
          onClick={() => setActiveTab('featured')}
          className="btn"
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            background: activeTab === 'featured' ? 'var(--primary)' : 'var(--bg-card)',
            color: 'white', fontWeight: activeTab === 'featured' ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Star size={16} />
          Destaques
        </button>
      </div>

      {/* CONTEÚDO 1: FILA DE PEDIDOS */}
      {activeTab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
              <ChefHat size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
              <h3>Cozinha tranquila!</h3>
              <p>Nenhum pedido na fila de preparo no momento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {orders.map(order => (
                <div 
                  key={order.id} 
                  className="card" 
                  style={{ 
                    borderLeft: order.status === 'preparing' ? '4px solid var(--primary)' : 
                                order.status === 'ready' ? '4px solid var(--success)' : 
                                '4px solid #a0a0a5'
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">
                      Mesa {order.table_session?.table_number ?? '?'}
                      {order.comanda_number && ` • Comanda ${order.comanda_number}`}
                    </span>
                    <span className="text-muted text-sm">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <div className="font-bold">{item.quantity}x {item.product?.name ?? 'Item'}</div>
                        {item.notes && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', paddingLeft: '8px', borderLeft: '2px solid var(--danger)' }}>Obs: {item.notes}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      <button 
                        onClick={() => updateStatus(order.id, 'pending')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'pending' ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: order.status === 'pending' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'pending' ? 'bold' : 'normal'
                        }}
                      >
                        Novo
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'preparing' ? 'var(--primary)' : 'transparent',
                          color: order.status === 'preparing' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'preparing' ? 'bold' : 'normal'
                        }}
                      >
                        Preparando
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: order.status === 'ready' ? 'var(--success)' : 'transparent',
                          color: order.status === 'ready' ? 'white' : 'var(--text-muted)',
                          fontWeight: order.status === 'ready' ? 'bold' : 'normal'
                        }}
                      >
                        Finalizado
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => updateStatus(order.id, 'paid')}
                      className="btn btn-primary"
                      style={{ 
                        width: '100%', padding: '10px', fontSize: '0.9rem', 
                        background: 'var(--success)', color: 'white', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      <Check size={18} />
                      Marcar como Pago
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CONTEÚDO 2: CARDÁPIO DO CLIENTE (LISTA DE PRODUTOS) */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {menu.map(category => (
            <div key={category.id} className="card" style={{ padding: '20px' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Excluir Categoria"
                >
                  <Trash2 size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Excluir Categoria</span>
                </button>
              </h2>
              
              {category.products.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum produto nesta categoria.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {category.products.map(product => (
                    <div 
                      key={product.id} 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px',
                        borderLeft: product.is_available ? '3px solid var(--success)' : '3px solid var(--danger)',
                        flexWrap: 'wrap', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                        )}
                        <div>
                          <div className="font-bold">{product.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleAvailability(product.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                            background: product.is_available ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            color: product.is_available ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${product.is_available ? 'var(--success)' : 'var(--danger)'}`
                          }}
                        >
                          {product.is_available ? 'Disponível' : 'Indisponível'}
                        </button>
                        <button
                          onClick={() => setEditingProduct({...product, price: product.price.toString()})}
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)', color: 'white',
                            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Editar Produto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: 'rgba(244, 67, 54, 0.1)', color: 'var(--danger)',
                            border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Excluir Produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO 3: ADICIONAR PRODUTO E CATEGORIA */}
      {activeTab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Formulário de Categoria */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="mb-4" style={{ color: 'var(--primary)' }}>Criar Nova Categoria</h2>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nome da Categoria *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Sobremesas"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={categoryLoading}
                style={{ padding: '10px 20px', height: '42px' }}
              >
                {categoryLoading ? 'Criando...' : 'Adicionar'}
              </button>
            </form>
          </div>

          {/* Formulário de Produto */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="mb-4" style={{ color: 'var(--primary)' }}>Adicionar Novo Produto</h2>
          
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nome do Produto *</label>
              <input 
                type="text" 
                placeholder="Ex: Hambúrguer Duplo"
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--bg-dark)', color: 'white', outline: 'none'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Categoria *</label>
                <select 
                  value={newProductCategoryId}
                  onChange={e => setNewProductCategoryId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none', height: '42px'
                  }}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Preço (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 29.90"
                  value={newProductPrice}
                  onChange={e => setNewProductPrice(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>URL da Imagem</label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/... (ou deixe em branco)"
                value={newProductImageUrl}
                onChange={e => setNewProductImageUrl(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--bg-dark)', color: 'white', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Descrição</label>
              <textarea 
                placeholder="Descreva o produto, ingredientes, etc."
                value={newProductDescription}
                onChange={e => setNewProductDescription(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--bg-dark)', color: 'white', outline: 'none', minHeight: '80px'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={formLoading}
              style={{ marginTop: '10px' }}
            >
              {formLoading ? 'Adicionando...' : 'Salvar Produto'}
            </button>
          </form>
          </div>
        </div>
      )}

      {/* CONTEÚDO 4: BANNERS DO CARROSSEL */}
      {activeTab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
          {/* Formulário de novo banner */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={20} /> Adicionar Banner
            </h2>
            <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Título *</label>
                  <input
                    type="text" placeholder="Ex: Combo do Dia"
                    value={newBannerTitle} onChange={e => setNewBannerTitle(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Badge (ex: 🔥 Destaque)</label>
                  <input
                    type="text" placeholder="Ex: O Mais Pedido 🔥"
                    value={newBannerBadge} onChange={e => setNewBannerBadge(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subtítulo</label>
                <input
                  type="text" placeholder="Ex: Hambúrguer + Fritas por R$ 45,90"
                  value={newBannerSubtitle} onChange={e => setNewBannerSubtitle(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>URL da Imagem *</label>
                <input
                  type="url" placeholder="https://images.unsplash.com/..."
                  value={newBannerImageUrl} onChange={e => setNewBannerImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                  required
                />
              </div>
              {newBannerImageUrl && (
                <img src={newBannerImageUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} onError={e => e.target.style.display = 'none'} />
              )}
              <button type="submit" className="btn btn-primary" disabled={bannerLoading}>
                {bannerLoading ? 'Salvando...' : 'Adicionar Banner'}
              </button>
            </form>
          </div>

          {/* Lista de banners existentes */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Banners Ativos ({banners.length})</h3>
            {banners.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum banner cadastrado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {banners.map(banner => (
                  <div key={banner.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <img src={banner.image_url} alt={banner.title} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden', minWidth: '120px' }}>
                      <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>{banner.title}</div>
                      {banner.badge && <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{banner.badge}</div>}
                      {banner.subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{banner.subtitle}</div>}
                    </div>

                    {/* Inline confirmation */}
                    {confirmDeleteBannerId === banner.id ? (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          style={{ padding: '6px 12px', background: 'var(--danger)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteBannerId(null)}
                          style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteBannerId(banner.id)}
                        style={{ padding: '8px', background: 'rgba(244,67,54,0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}
                        title="Remover banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO 5: PRODUTOS EM DESTAQUE */}
      {activeTab === 'featured' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ative ou desative os produtos que aparecem na seção <strong style={{ color: 'white' }}>Destaques da Semana</strong> na página inicial do cliente.
          </p>
          {menu.map(category => (
            <div key={category.id} className="card" style={{ padding: '20px' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {category.name}
              </h2>
              {category.products.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum produto nesta categoria.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {category.products.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px', borderLeft: product.is_featured ? '3px solid var(--primary)' : '3px solid transparent' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'white' }}>{product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>R$ {product.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured(product.id, product.is_featured)}
                        style={{
                          padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                          background: product.is_featured ? 'rgba(242, 133, 0, 0.15)' : 'var(--bg-card)',
                          color: product.is_featured ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${product.is_featured ? 'var(--primary)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                        }}
                      >
                        <Star size={14} fill={product.is_featured ? 'var(--primary)' : 'none'} />
                        {product.is_featured ? 'Destaque Ativo' : 'Ativar Destaque'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PRODUTO */}
      {editingProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setEditingProduct(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ color: 'var(--primary)' }}>Editar Produto</h2>
            
            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nome do Produto *</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Categoria *</label>
                  <select 
                    value={editingProduct.category_id}
                    onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                      background: 'var(--bg-dark)', color: 'white', outline: 'none', height: '42px'
                    }}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Preço (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                      background: 'var(--bg-dark)', color: 'white', outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>URL da Imagem</label>
                <input 
                  type="url" 
                  value={editingProduct.image_url || ''}
                  onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Descrição</label>
                <textarea 
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none', minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingProduct(null)}
                  style={{ flex: 1, borderColor: 'var(--border)', color: 'var(--text-main)' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={editProductLoading}
                  style={{ flex: 1 }}
                >
                  {editProductLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
