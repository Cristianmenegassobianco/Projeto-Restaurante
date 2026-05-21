import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { QrCode, UtensilsCrossed } from 'lucide-react';

export default function Home() {
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useStore(state => state.setSession);
  const navigate = useNavigate();

  const handleScanMock = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;
    
    setLoading(true);
    try {
      // Mock da chamada ao backend
      const res = await fetch('/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: tableNumber })
      });
      
      const data = await res.json();
      if (data.token) {
        setSession(data);
        navigate('/menu');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o restaurante.');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <UtensilsCrossed size={64} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h1>Bem-vindo!</h1>
        <p>Escaneie o QR Code da sua mesa ou digite o número para começar.</p>
      </div>

      <div className="card" style={{ width: '100%' }}>
        <form onSubmit={handleScanMock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
              Número da Mesa
            </label>
            <input 
              type="number" 
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ex: 5"
              style={{
                width: '100%', padding: '14px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'var(--bg-dark)',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <span>Conectando...</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} />
                <span>Acessar Cardápio</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
