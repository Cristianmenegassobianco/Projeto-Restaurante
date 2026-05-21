import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Check, ChefHat, PlusCircle, Trash2 } from 'lucide-react';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'add'

  // Add Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    // 1. Carregar pedidos iniciais
    fetch('/api/kitchen/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));

    // 2. Conectar socket para pedidos em tempo real
    const socket = io();
    
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

  // Carregar cardápio e categorias quando mudar para as abas de admin
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'add') {
      fetchMenuAndCategories();
    }
  }, [activeTab]);

  const fetchMenuAndCategories = async () => {
    try {
      const menuRes = await fetch('/api/admin/menu');
      const menuData = await menuRes.json();
      setMenu(menuData);

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      setCategories(catData);
      if (catData.length > 0 && !newProductCategoryId) {
        setNewProductCategoryId(catData[0].id);
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
        alert('Erro ao excluir produto. Ele pode estar associado a pedidos existentes.');
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
              <h2 style={{ color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {category.name}
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
                          onClick={() => deleteProduct(product.id)}
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: 'rgba(244, 67, 54, 0.1)', color: 'var(--danger)',
                            border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
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

      {/* CONTEÚDO 3: ADICIONAR PRODUTO */}
      {activeTab === 'add' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
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
      )}
    </div>
  );
}
