import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Trash2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Cart() {
  const { cart, removeFromCart, clearCart, session } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Controle do Scanner de QR Code
  const [showScanner, setShowScanner] = useState(false);
  const [mockComanda, setMockComanda] = useState('');

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      // Inicia o scanner de QR Code no elemento com id="reader"
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true
      }, false);

      scanner.render(
        (decodedText) => {
          // Quando ler o QR Code com sucesso
          onComandaScanned(decodedText);
          scanner.clear().catch(err => console.error(err));
        },
        (error) => {
          // Callback de erro silencioso do scan
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error('Erro ao limpar scanner:', err));
      }
    };
  }, [showScanner]);

  const onComandaScanned = (comandaCode) => {
    setShowScanner(false);
    submitOrder(comandaCode);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowScanner(true);
  };

  const submitOrder = async (comandaNumber) => {
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          total_amount: total,
          comanda_number: comandaNumber,
          items: cart.map(i => ({
            product_id: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
            notes: i.notes
          }))
        })
      });

      if (res.ok) {
        clearCart();
        alert(`Pedido enviado para a cozinha na Comanda ${comandaNumber}!`);
        navigate('/orders');
      } else {
        alert('Erro ao enviar pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Sua comanda está vazia</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/menu')}>
          Ver Cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cart.map((item, idx) => (
          <div key={idx} className="card flex gap-4" style={{ position: 'relative' }}>
            {item.product.image_url && (
              <img 
                src={item.product.image_url} 
                alt={item.product.name} 
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div className="flex justify-between">
                <h4 style={{ fontSize: '1rem', width: '80%' }}>{item.quantity}x {item.product.name}</h4>
                <button 
                  onClick={() => removeFromCart(item.product.id, item.notes)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              {item.notes && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px' }}>{item.notes}</p>}
              <div className="font-bold mt-2">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL SCANNER QR CODE */}
      {showScanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '16px', textAlign: 'center' }}>Escaneie a Comanda</h3>
            
            {/* Elemento onde o html5-qrcode renderiza a camera */}
            <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}></div>
            
            {/* Opção de Simulação para desenvolvimento */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
                Testando no PC? Simule digitando a comanda:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Nº da comanda (ex: 15)" 
                  value={mockComanda}
                  onChange={(e) => setMockComanda(e.target.value)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => onComandaScanned(mockComanda)}
                  disabled={!mockComanda}
                  style={{ padding: '0 16px' }}
                >
                  Simular
                </button>
              </div>
            </div>

            <button 
              className="btn btn-outline" 
              onClick={() => setShowScanner(false)}
              style={{ width: '100%', marginTop: '16px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* FOOTER COM TOTAL E SUBMIT */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '600px', padding: '16px 20px',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        zIndex: 100
      }}>
        <div className="flex justify-between mb-4 text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
        <button className="btn btn-primary" onClick={handleCheckoutClick} disabled={loading}>
          {loading ? 'Enviando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}
