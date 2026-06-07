import React, { useState, useEffect } from 'react';
import { Lock, ChefHat, CreditCard, BarChart2, LogOut, TabletSmartphone } from 'lucide-react';
import Kitchen from './Kitchen';
import MenuManagement from './MenuManagement';
import Payment from './Payment';
import Reports from './Reports';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('kitchen'); // 'kitchen' | 'cashier'

  const handleLogin = (e) => {
    e.preventDefault();
    // Senha hardcoded provisória para o gerenciamento
    if (password === 'admin123' || password === 'admin') {
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#212322', backgroundImage: 'none', color: 'white' }}>
        <div className="card" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Lock size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Acesso Gerencial</h2>
            <p style={{ color: 'white', fontSize: '0.9rem' }}>Área restrita a gerentes e funcionários.</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input 
                type="password" 
                placeholder="Senha de Acesso (ex: admin)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', 
                  background: 'var(--bg-dark)', color: 'white', fontSize: '1rem', outline: 'none'
                }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', fontWeight: 'bold' }}>
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#212322', backgroundImage: 'none', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar - Controle das Abas Gerenciais */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100, // Mantém a barra gerencial sempre visível
        width: '100vw', marginLeft: 'calc(-50vw + 50%)', 
        paddingLeft: 'calc(50vw - 50% + 24px)', paddingRight: 'calc(50vw - 50% + 24px)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('kitchen')}
            style={{
              padding: '10px 20px', background: activeTab === 'kitchen' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'kitchen' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <ChefHat size={20} /> Monitor de Pedidos
          </button>
          
          <button 
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '10px 20px', background: activeTab === 'menu' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'menu' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <ChefHat size={20} /> Cardápio e Banners
          </button>
          <button 
            onClick={() => setActiveTab('cashier')}
            style={{
              padding: '10px 20px', background: activeTab === 'cashier' ? 'var(--success)' : 'transparent',
              color: activeTab === 'cashier' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={20} /> Caixa e Pagamentos
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '10px 20px', background: activeTab === 'reports' ? 'var(--success)' : 'transparent',
              color: activeTab === 'reports' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <BarChart2 size={20} /> Relatórios Financeiros
          </button>

          <button 
            onClick={() => window.open('/waiter', '_blank')}
            style={{
              padding: '10px 20px', background: 'transparent',
              color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            title="Abrir Aba Garçom em nova guia"
          >
            <TabletSmartphone size={20} /> Aba Garçom
          </button>
        </div>

        <button 
          onClick={() => setIsLoggedIn(false)}
          style={{ 
            background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', 
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
          }}
          title="Sair do Gerenciamento"
        >
          <LogOut size={18} /> Sair
        </button>
      </header>

      {/* Área de Conteúdo */}
      <div style={{ flex: 1 }}>
        {activeTab === 'kitchen' && <Kitchen />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'cashier' && <Payment />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
}
