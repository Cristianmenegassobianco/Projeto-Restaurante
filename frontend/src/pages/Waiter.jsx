import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { UtensilsCrossed, ShoppingBag, PlusCircle, MinusCircle, Trash2, Search, Send, BellRing, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import { playBeep } from '../utils/audio';

export default function Waiter() {
  const navigate = useNavigate();
  
  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Waiter Order State
  const [waiterName, setWaiterName] = useState(() => localStorage.getItem('waiterName') || '');
  const [isNameConfirmed, setIsNameConfirmed] = useState(!!localStorage.getItem('waiterName'));
  const [tableNumber, setTableNumber] = useState('');
  const [comandaNumber, setComandaNumber] = useState('');
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [platesCount, setPlatesCount] = useState(0);
  const [wineGlassesCount, setWineGlassesCount] = useState(0);
  const [glassesNormalCount, setGlassesNormalCount] = useState(0);
  const [glassesIceCount, setGlassesIceCount] = useState(0);
  const [glassesIceLemonCount, setGlassesIceLemonCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState('order'); // 'order' or 'history'
  const [myOrders, setMyOrders] = useState(() => JSON.parse(localStorage.getItem('myOrders') || '[]'));
  
  const [waiterCalls, setWaiterCalls] = useState([]);

  useEffect(() => {
    localStorage.setItem('waiterName', waiterName);
  }, [waiterName]);

  // Fetch menu
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
        else setCategories([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // Socket para ouvir chamados
    const socket = io(import.meta.env.VITE_API_URL || '', { path: '/socket.io' });
    
    socket.on('waiter_called', (call) => {
      // Play native beep notification
      playBeep();

      setWaiterCalls(prev => {
        // Substitui se já houver chamado pra essa mesa, ou adiciona
        return [...prev.filter(c => c.table !== call.table), call];
      });
    });

    socket.on('waiter_call_attended', ({ call_id, waiter_name }) => {
      setWaiterCalls(prev => prev.map(call => 
        call.id === call_id ? { ...call, status: 'attended', attendedBy: waiter_name } : call
      ));
      
      // Remove da tela após 20 segundos
      setTimeout(() => {
        setWaiterCalls(prev => prev.filter(call => call.id !== call_id));
      }, 20000);
    });
    
    socket.on('order_status_update', (updatedOrder) => {
      setMyOrders(prev => {
        const index = prev.findIndex(o => o.id === updatedOrder.id);
        if (index > -1) {
          const newOrders = [...prev];
          newOrders[index] = { ...newOrders[index], status: updatedOrder.status };
          localStorage.setItem('myOrders', JSON.stringify(newOrders));
          return newOrders;
        }
        return prev;
      });
    });
    
    return () => socket.disconnect();
  }, []);

  const handleAttendCall = async (call) => {
    if (!waiterName) {
      toast.error('Identifique-se primeiro na tela inicial (preencha seu nome) para poder atender!');
      return;
    }
    
    // Atualização otimista: já marca localmente como atendido
    setWaiterCalls(prev => prev.map(c => 
      c.id === call.id ? { ...c, status: 'attended', attendedBy: waiterName } : c
    ));

    // Garantia de remoção local após 20 segundos
    setTimeout(() => {
      setWaiterCalls(prev => prev.filter(c => c.id !== call.id));
    }, 20000);

    try {
      await fetch('/api/call-waiter/attend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: call.id, waiter_name: waiterName })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const manuallyDismissCall = (callId) => {
    setWaiterCalls(prev => prev.filter(c => c.id !== callId));
  };

  const cancelOrder = async (orderId) => {
    if (window.confirm('Certeza absoluta que deseja CANCELAR este pedido? Ele sumirá da tela da cozinha!')) {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'canceled' })
        });
        
        if (res.ok) {
          const updatedOrders = myOrders.filter(o => o.id !== orderId);
          setMyOrders(updatedOrders);
          localStorage.setItem('myOrders', JSON.stringify(updatedOrders));
          toast.success('Pedido apagado da cozinha com sucesso!');
        } else {
          toast.error('Não foi possível cancelar na cozinha (Pode ser um pedido muito antigo).');
        }
      } catch (err) {
        toast.error('Erro de conexão ao cancelar o pedido.');
      }
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (!res.ok) {
        toast.error('Não foi possível marcar como concluído.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    }
  };

  const clearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o seu histórico de pedidos da tela? (Isso NÃO cancelará os pedidos que já estão na cozinha)')) {
      setMyOrders([]);
      localStorage.removeItem('myOrders');
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            return { ...item, quantity: Number(item.quantity) + Number(delta) };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateNotes = (productId, notes) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, notes } : item
    ));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const p = parseFloat(item.product?.price) || 0;
    const q = parseInt(item.quantity, 10) || 0;
    return acc + (p * q);
  }, 0);
  
  const cartItemsCount = cart.reduce((acc, item) => {
    const q = parseInt(item.quantity, 10) || 0;
    return acc + q;
  }, 0);

  const handleSubmitOrder = async () => {
    if (!waiterName) {
      toast.error('Por favor, informe seu nome (Garçom).');
      return;
    }
    if (!comandaNumber) {
      toast.error('Por favor, informe o número da comanda.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Adicione produtos ao pedido.');
      return;
    }

    setSendingOrder(true);
    try {
      // 1. Initialize Session
      const sessionRes = await fetch('/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: tableNumber ? parseInt(tableNumber) : 0 })
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.session_id) {
        throw new Error('Falha ao iniciar sessão da mesa');
      }

      let utensils = [];
      if (platesCount > 0) utensils.push(`${platesCount} Prato(s)`);
      if (wineGlassesCount > 0) utensils.push(`${wineGlassesCount} Taça(s)`);
      if (glassesNormalCount > 0) utensils.push(`${glassesNormalCount} Copo(s)`);
      if (glassesIceCount > 0) utensils.push(`${glassesIceCount} Copo(s) c/ Gelo`);
      if (glassesIceLemonCount > 0) utensils.push(`${glassesIceLemonCount} Copo(s) c/ Gelo e Limão`);
      
      const utensilsString = utensils.length > 0 ? ` — Utensílios: ${utensils.join(', ')}` : '';

      // 2. Send Order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          total_amount: cartTotal,
          comanda_number: comandaNumber || null,
          waiter_name: waiterName,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            notes: item.notes
          }))
        })
      });

      const orderData = await orderRes.json();

      if (orderRes.ok) {
        toast.success('Pedido enviado com sucesso para a cozinha!');
        
        // Save to local history
        const newOrder = {
          id: orderData.id || Date.now(),
          time: new Date().toLocaleTimeString(),
          table: tableNumber || 'S/N',
          comanda: comandaNumber,
          total: cartTotal,
          itemsCount: cartItemsCount,
          itemsList: cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ') + utensilsString,
          status: orderData.status || 'pending'
        };
        const updatedOrders = [newOrder, ...myOrders].slice(0, 50);
        setMyOrders(updatedOrders);
        localStorage.setItem('myOrders', JSON.stringify(updatedOrders));

        // Reset waiter state for next order
        setCart([]);
        setTableNumber('');
        setComandaNumber('');
        setPlatesCount(0);
        setWineGlassesCount(0);
        setGlassesNormalCount(0);
        setGlassesIceCount(0);
        setGlassesIceLemonCount(0);
        setShowCartModal(false);
      } else {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao enviar pedido (Status ' + orderRes.status + ')');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar o pedido: ' + error.message);
    }
    setSendingOrder(false);
  };

  if (!isNameConfirmed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', background: '#212322', backgroundImage: 'none', justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', background: 'var(--bg-card)' }}>
          <UtensilsCrossed size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Área do Garçom</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Identifique-se para começar os lançamentos</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (waiterName.trim().length > 0) {
              setIsNameConfirmed(true);
            }
          }}>
            <input 
              type="text" 
              placeholder="Seu Nome (Garçom)"
              value={waiterName}
              onChange={e => setWaiterName(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', fontSize: '1rem', marginBottom: '16px', textAlign: 'center' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
              Entrar e Começar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '90px', background: '#212322', backgroundImage: 'none' }}>
      <header className="header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UtensilsCrossed size={22} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: 1.1 }}>Aba Garçom</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👨‍🍳 {waiterName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('order')}
            style={{ background: activeTab === 'order' ? 'var(--primary)' : 'transparent', color: activeTab === 'order' ? 'white' : 'var(--text-muted)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            Fazer Pedido
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? 'white' : 'var(--text-muted)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            Pedidos
          </button>
          <button 
            onClick={() => {
              setIsNameConfirmed(false);
              setWaiterName('');
              localStorage.removeItem('waiterName');
            }}
            style={{ background: 'transparent', color: 'var(--danger)', border: 'none', padding: '6px', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '4px' }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* ALERTAS DE CHAMADOS */}
      {waiterCalls.length > 0 && (
        <div style={{ padding: '20px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {waiterCalls.map(call => {
            const isAttended = call.status === 'attended';
            const isMe = call.attendedBy === waiterName;
            
            let bgColor = 'rgba(255, 193, 7, 0.1)';
            let borderColor = '#ffc107';
            let textColor = '#ffc107';
            
            if (isAttended) {
              if (isMe) {
                bgColor = 'rgba(46, 213, 115, 0.15)';
                borderColor = 'var(--success)';
                textColor = 'white';
              } else {
                bgColor = 'rgba(160, 82, 45, 0.15)'; // Sienna (Marrom)
                borderColor = '#A0522D';
                textColor = 'white';
              }
            }

            return (
              <div key={call.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isAttended ? <Check size={24} color={textColor} /> : <BellRing size={24} color={textColor} />}
                  <div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.05rem' }}>
                      Mesa {call.table} {isAttended ? 'Sendo atendida!' : 'está chamando!'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {isAttended ? `Atendido por: ${call.attendedBy}` : `Chamado às ${call.time}`}
                    </div>
                  </div>
                </div>
                {isAttended ? (
                  <button 
                    onClick={() => manuallyDismissCall(call.id)}
                    style={{ background: 'transparent', color: textColor, border: `1px solid ${borderColor}`, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                    title="Ocultar aviso"
                  >
                    ×
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAttendCall(call)}
                    style={{ background: '#ffc107', color: 'black', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Atender
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="container" style={{ padding: '20px' }}>
        
        {activeTab === 'history' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Meus Pedidos</h3>
              {myOrders.length > 0 && (
                <button 
                  onClick={clearHistory}
                  style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Limpar Histórico
                </button>
              )}
            </div>
            
            {myOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Nenhum pedido feito ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myOrders.map(order => {
                  let statusColor = 'var(--text-muted)';
                  let statusText = 'Aguardando';
                  
                  if (order.status === 'preparing') { statusColor = '#f39c12'; statusText = 'Preparando'; }
                  if (order.status === 'ready') { statusColor = 'var(--success)'; statusText = 'Pronto p/ Entrega'; }
                  if (order.status === 'delivered') { statusColor = '#9b59b6'; statusText = 'Concluído (Entregue)'; }
                  if (order.status === 'paid') { statusColor = '#3498db'; statusText = 'Pago'; }

                  return (
                    <div key={order.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${statusColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Mesa {order.table} {order.comanda ? `| Cmd ${order.comanda}` : ''}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', background: statusColor, color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', textAlign: 'center' }}>{statusText}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.time}</span>
                          
                          {order.status === 'ready' && (
                            <button 
                              onClick={() => markAsDelivered(order.id)}
                              style={{ background: 'var(--success)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                              <Check size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                              Entregar
                            </button>
                          )}

                          <button 
                            onClick={() => cancelOrder(order.id)}
                            style={{ background: 'rgba(255, 71, 87, 0.1)', border: 'none', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Cancelar pedido na cozinha"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', lineHeight: '1.4' }}>
                        {order.itemsList || `${order.itemsCount} itens`}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>R$ {(order.total || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Informações da Mesa/Comanda */}
            <div className="card" style={{ padding: '16px', marginBottom: '20px', background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Dados do Pedido</h3>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nº da Mesa (Opcional)</label>
              <input 
                type="number" 
                value={tableNumber} 
                onChange={e => setTableNumber(e.target.value)}
                placeholder="Ex: 5"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', fontSize: '1rem' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Comanda *</label>
              <input 
                type="text" 
                value={comandaNumber} 
                onChange={e => setComandaNumber(e.target.value)}
                placeholder="Ex: 102"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', fontSize: '1rem' }}
              />
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
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

        {/* Produtos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando cardápio...</div>
          ) : (
            categories
              .filter(cat => selectedCategory === 'all' || selectedCategory === cat.id)
              .map(category => (
                <div key={category.id} style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {category.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {category.products && category.products.map(product => {
                      const cartItem = cart.find(item => item.product.id === product.id);
                      const quantity = cartItem ? cartItem.quantity : 0;
                      
                      return (
                        <div key={product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{product.name}</div>
                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '4px' }}>
                              R$ {product.price.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: quantity > 0 ? 'flex' : 'none', alignItems: 'center', gap: '12px' }}>
                                <button type="button" onClick={() => updateQuantity(product.id, -1)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <MinusCircle size={20} />
                                </button>
                                <span style={{ fontWeight: 'bold', minWidth: '24px', textAlign: 'center', fontSize: '1.1rem' }}>{quantity}</span>
                                <button type="button" onClick={() => updateQuantity(product.id, 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <PlusCircle size={20} />
                                </button>
                            </div>
                            <div style={{ display: quantity === 0 ? 'block' : 'none' }}>
                                <button 
                                  onClick={() => addToCart(product)}
                                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '6px 16px', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                                >
                                  Adicionar
                                </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
          </div>
        )}
      </div>

      {/* Footer Fixo */}
      {activeTab === 'order' && cartItemsCount > 0 && (
        <div className="responsive-width" style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          padding: '16px 20px',
          background: '#212322', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total ({cartItemsCount} itens)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>R$ {(cartTotal || 0).toFixed(2).replace('.', ',')}</div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCartModal(true)}
            style={{ width: 'auto', display: 'flex', gap: '6px', alignItems: 'center', padding: '12px 20px', fontSize: '1rem' }}
          >
            <ShoppingBag size={18} />
            Revisar Pedido
          </button>
        </div>
      )}

      {/* Modal de Carrinho / Revisão */}
      {showCartModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
          display: 'flex', justifyContent: 'center'
        }}>
          <div className="responsive-width" style={{
            background: '#212322',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Revisão do Pedido</h2>
              <button onClick={() => setShowCartModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: '8px' }}>Voltar</button>
            </div>

            <div style={{ padding: '20px', flex: 1 }}>
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(46, 213, 115, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'white' }}>
              <strong>Comanda:</strong> {comandaNumber} <br/>
              <strong>Mesa:</strong> {tableNumber || 'Não informada'}
            </div>

            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Utensílios para a Mesa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '500', color: 'white' }}>Pratos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setPlatesCount(Math.max(0, platesCount - 1))} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><MinusCircle size={16} style={{margin: 'auto'}}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{platesCount}</span>
                  <button type="button" onClick={() => setPlatesCount(platesCount + 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><PlusCircle size={16} style={{margin: 'auto'}}/></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '500', color: 'white' }}>Taças</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setWineGlassesCount(Math.max(0, wineGlassesCount - 1))} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><MinusCircle size={16} style={{margin: 'auto'}}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{wineGlassesCount}</span>
                  <button type="button" onClick={() => setWineGlassesCount(wineGlassesCount + 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><PlusCircle size={16} style={{margin: 'auto'}}/></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '500', color: 'white' }}>Copos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setGlassesNormalCount(Math.max(0, glassesNormalCount - 1))} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><MinusCircle size={16} style={{margin: 'auto'}}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{glassesNormalCount}</span>
                  <button type="button" onClick={() => setGlassesNormalCount(glassesNormalCount + 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><PlusCircle size={16} style={{margin: 'auto'}}/></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '500', color: 'white' }}>Copos com Gelo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setGlassesIceCount(Math.max(0, glassesIceCount - 1))} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><MinusCircle size={16} style={{margin: 'auto'}}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{glassesIceCount}</span>
                  <button type="button" onClick={() => setGlassesIceCount(glassesIceCount + 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><PlusCircle size={16} style={{margin: 'auto'}}/></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '500', color: 'white' }}>Copos com Gelo e Limão</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setGlassesIceLemonCount(Math.max(0, glassesIceLemonCount - 1))} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><MinusCircle size={16} style={{margin: 'auto'}}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{glassesIceLemonCount}</span>
                  <button type="button" onClick={() => setGlassesIceLemonCount(glassesIceLemonCount + 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex' }}><PlusCircle size={16} style={{margin: 'auto'}}/></button>
                </div>
              </div>

            </div>

            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Itens Selecionados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map((item) => (
                <div key={item.product.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.quantity}x {item.product.name}</div>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>R$ {((parseFloat(item.product?.price) || 0) * (parseInt(item.quantity, 10) || 0)).toFixed(2).replace('.', ',')}</div>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Observações (ex: Sem cebola)" 
                    value={item.notes}
                    onChange={(e) => updateNotes(item.product.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', fontSize: '0.85rem', marginBottom: '12px' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Trash2 size={16} /> Remover
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <MinusCircle size={16} />
                      </button>
                      <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', position: 'sticky', bottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span style={{ color: 'white' }}>R$ {(cartTotal || 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', fontSize: '1.1rem' }}
              onClick={handleSubmitOrder}
              disabled={sendingOrder || !comandaNumber || cart.length === 0}
            >
              <div style={{ display: sendingOrder ? 'none' : 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} />
                <span>Enviar para Cozinha</span>
              </div>
              <div style={{ display: sendingOrder ? 'block' : 'none' }}>
                Enviando...
              </div>
            </button>
          </div>
          </div>
        </div>
      )}

    </div>
  );
}
