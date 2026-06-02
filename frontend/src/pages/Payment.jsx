import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, ArrowLeft, Search, Scan, X, CheckCircle, Receipt, 
  Plus, Minus, Unlock, Lock, DollarSign, User, FileText, Printer,
  ClipboardList, ChefHat, Clock, CheckCircle2
} from 'lucide-react';

export default function Payment() {
  const navigate = useNavigate();



  // Active tab: 'pdv' | 'consulta'
  const [activeTab, setActiveTab] = useState('pdv');

  const [comandaNumber, setComandaNumber] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Last payment details for NFC-e printing
  const [lastPaymentInfo, setLastPaymentInfo] = useState(null);
  const [showFiscalReceipt, setShowFiscalReceipt] = useState(false);
  const [showStandardReceipt, setShowStandardReceipt] = useState(false);

  // Cash Session State
  const [activeSession, setActiveSession] = useState(null);
  const [movements, setMovements] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Cash Opening State
  const [operatorName, setOperatorName] = useState('');
  const [openingValue, setOpeningValue] = useState('');

  // Cash Movement Modal (Sangria/Suprimento)
  const [movementType, setMovementType] = useState(null); // 'suprimento' | 'sangria' | null
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementLoading, setMovementLoading] = useState(false);

  // Cash Closing Modal (Fechamento Cego)
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredCards, setDeclaredCards] = useState('');
  const [closingResult, setClosingResult] = useState(null);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('dinheiro'); // 'dinheiro' | 'pix' | 'cartao'
  const [createNfce, setCreateNfce] = useState(true);
  const [receivedCash, setReceivedCash] = useState('');

  // Simulators
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixStatus, setPixStatus] = useState('generating'); // 'generating' | 'waiting' | 'paid'
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardStatus, setCardStatus] = useState('waiting'); // 'waiting' | 'reading' | 'approved'





  // --- ABA CONSULTAR COMANDA ---
  const [consultaComanda, setConsultaComanda] = useState('');
  const [consultaOrders, setConsultaOrders] = useState([]);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaSearched, setConsultaSearched] = useState(false);
  const [consultaError, setConsultaError] = useState('');

  const fetchConsultaOrders = async (num) => {
    const number = num || consultaComanda;
    if (!number) return;
    setConsultaLoading(true);
    setConsultaError('');
    setConsultaSearched(false);
    try {
      // Busca TODOS os pedidos da comanda (incluindo pagos)
      const res = await fetch(`/api/comandas/${number}/orders`);
      if (res.ok) {
        const data = await res.json();
        setConsultaOrders(data);
        setConsultaSearched(true);
        if (data.length === 0) {
          setConsultaError('Nenhum pedido pendente encontrado para esta comanda.');
        }
      } else {
        setConsultaError('Erro ao buscar pedidos da comanda.');
      }
    } catch (err) {
      console.error(err);
      setConsultaError('Erro de conexão ao buscar comanda.');
    } finally {
      setConsultaLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#a0a0a5" />;
      case 'preparing': return <ChefHat size={16} color="var(--primary)" />;
      case 'ready': return <CheckCircle2 size={16} color="var(--success)" />;
      case 'paid': return <CheckCircle2 size={16} color="var(--success)" />;
      default: return <Clock size={16} color="#a0a0a5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'paid': return 'Pago';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#a0a0a5';
      case 'preparing': return 'var(--primary)';
      case 'ready': return 'var(--success)';
      case 'paid': return 'var(--success)';
      default: return '#a0a0a5';
    }
  };

  // Carregar sessão de caixa atual
  const fetchActiveSession = async () => {
    setSessionLoading(true);
    try {
      const res = await fetch('/api/cash-session/current');
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        if (data) {
          fetchMovements();
        }
      }
    } catch (err) {
      console.error('Erro ao buscar sessão de caixa:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/cash-session/movements');
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, []);



  const fetchOrders = async (numberToSearch) => {
    const num = numberToSearch || comandaNumber;
    if (!num) return;

    setLoading(true);
    setPaymentSuccess(false);
    try {
      const res = await fetch(`/api/comandas/${num}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setSearched(true);
        setReceivedCash('');
      } else {
        alert('Erro ao buscar pedidos da comanda.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao buscar comanda.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir o Caixa
  const handleOpenSession = async (e) => {
    e.preventDefault();
    if (!operatorName || !openingValue) {
      alert('Preencha o nome do operador e o troco inicial.');
      return;
    }

    try {
      const res = await fetch('/api/cash-session/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_name: operatorName,
          opening_value: parseFloat(openingValue)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setMovements([]);
        setOperatorName('');
        setOpeningValue('');
        alert('Caixa aberto com sucesso!');
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao abrir caixa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao abrir caixa.');
    }
  };

  // Registrar Sangria / Suprimento
  const handleRegisterMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    setMovementLoading(true);
    try {
      const res = await fetch('/api/cash-session/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movementType,
          amount: parseFloat(movementAmount),
          description: movementDescription
        })
      });

      if (res.ok) {
        alert(`${movementType === 'suprimento' ? 'Suprimento' : 'Sangria'} registrado com sucesso!`);
        setMovementType(null);
        setMovementAmount('');
        setMovementDescription('');
        fetchActiveSession();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar movimentação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar movimentação.');
    } finally {
      setMovementLoading(false);
    }
  };

  // Fechar o Caixa (Cego)
  const handleCloseSession = async (e) => {
    e.preventDefault();
    if (declaredCash === '' || declaredCards === '') {
      alert('Preencha os valores contados.');
      return;
    }

    try {
      const res = await fetch('/api/cash-session/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declared_cash: parseFloat(declaredCash),
          declared_cards: parseFloat(declaredCards)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setClosingResult(data);
        setActiveSession(null);
        setMovements([]);
        setShowCloseModal(false);
        setDeclaredCash('');
        setDeclaredCards('');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao fechar caixa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao fechar o caixa.');
    }
  };

  // Confirmar pagamento da comanda
  const processPaymentAPI = async (method) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comandas/${comandaNumber}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: method,
          create_nfce: createNfce
        })
      });

      if (res.ok) {
        const paymentData = await res.json();
        setLastPaymentInfo({
          comandaNumber,
          orders: [...orders],
          totalAmount: totalAmount,
          paymentMethod: method,
          nfce_emitted: paymentData.nfce_emitted,
          nfce_access_key: paymentData.nfce_access_key,
          date: new Date().toLocaleString()
        });
        setPaymentSuccess(true);
        setOrders([]);
        setSearched(false);
        setComandaNumber('');
        fetchActiveSession(); // Atualizar saldo de dinheiro do caixa
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao processar pagamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (orders.length === 0) return;
    
    if (paymentMethod === 'pix') {
      setPixStatus('generating');
      setShowPixModal(true);
      
      // Simulação de PIX Dinâmico
      setTimeout(() => {
        setPixStatus('waiting');
        
        // Simular pagamento automático pelo banco
        setTimeout(() => {
          setPixStatus('paid');
          setTimeout(() => {
            setShowPixModal(false);
            processPaymentAPI('pix');
          }, 1000);
        }, 3000);
      }, 1500);

    } else if (paymentMethod === 'cartao') {
      setCardStatus('waiting');
      setShowCardModal(true);

      // Simulação Smart POS
      setTimeout(() => {
        setCardStatus('reading');
        setTimeout(() => {
          setCardStatus('approved');
          setTimeout(() => {
            setShowCardModal(false);
            processPaymentAPI('cartao');
          }, 1000);
        }, 2000);
      }, 1200);

    } else {
      // Dinheiro físico direto
      if (receivedCash && parseFloat(receivedCash) < totalAmount) {
        alert('Valor recebido é menor que o total a pagar.');
        return;
      }
      processPaymentAPI('dinheiro');
    }
  };

  // Calcula o total geral de todas as ordens ativas da comanda
  const totalAmount = orders.reduce((acc, order) => acc + order.total_amount, 0);

  // Calcula saldo total em caixa atual
  const calculateCashInDrawer = () => {
    if (!activeSession) return 0;
    let cash = activeSession.opening_value;
    movements.forEach(m => {
      if (m.type === 'suprimento' || (m.type === 'venda' && m.method === 'dinheiro')) {
        cash += m.amount;
      } else if (m.type === 'sangria') {
        cash -= m.amount;
      }
    });
    return cash;
  };

  const cashInDrawer = calculateCashInDrawer();
  const changeValue = receivedCash ? (parseFloat(receivedCash) - totalAmount) : 0;

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)', color: 'white' }}>
        <p>Carregando dados do caixa...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)', color: 'white', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '0', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Voltar para a Home"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <CreditCard color="var(--primary)" />
            Frente de Caixa (PDV)
          </h1>
        </div>
        
        {activeSession ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(76, 175, 80, 0.15)', color: 'var(--success)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Unlock size={14} /><span>Caixa Aberto</span>
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(244, 67, 54, 0.15)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Lock size={14} /><span>Caixa Fechado</span>
          </span>
        )}
      </header>

      {/* ABAS DE NAVEGAÇÃO */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--border)', marginTop: '0' }}>
        <button
          onClick={() => setActiveTab('pdv')}
          style={{
            flex: 1, padding: '14px 16px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
            color: activeTab === 'pdv' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'pdv' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <CreditCard size={16} /> Caixa / PDV
        </button>
        <button
          onClick={() => setActiveTab('consulta')}
          style={{
            flex: 1, padding: '14px 16px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
            color: activeTab === 'consulta' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'consulta' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <ClipboardList size={16} /> Consultar Comanda
        </button>
      </div>

      {/* ===== CAIXA / PDV ===== */}
      {activeTab === 'pdv' && (<>


      {closingResult && (
        <div className="card print-area" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--primary)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Comprovante de Fechamento de Caixa
            </h3>
            <button 
              onClick={() => setClosingResult(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Operador:</span>
              <span style={{ fontWeight: 'bold' }}>{closingResult.operator_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Abertura:</span>
              <span>R$ {closingResult.opening_value.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fechamento às:</span>
              <span>{new Date(closingResult.closed_at).toLocaleString()}</span>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Conciliação de Dinheiro Físico</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Dinheiro Esperado no Sistema:</span>
              <span>R$ {closingResult.expected_cash.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Dinheiro Contado pelo Operador:</span>
              <span style={{ fontWeight: 'bold' }}>R$ {closingResult.declared_cash.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '8px', borderRadius: '6px',
              background: closingResult.difference_cash >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              color: closingResult.difference_cash >= 0 ? 'var(--success)' : 'var(--danger)',
              fontWeight: 'bold'
            }}>
              <span>
                {closingResult.difference_cash === 0 ? 'Sem Diferença' : 
                 closingResult.difference_cash > 0 ? 'Sobra de Caixa (Diferença Positiva):' : 'Quebra de Caixa (Falta de Dinheiro):'}
              </span>
              <span>R$ {closingResult.difference_cash.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Printer size={16} /> Imprimir Relatório
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setClosingResult(null)}
              style={{ flex: 1 }}
            >
              Confirmar Leitura e Fechar
            </button>
          </div>
        </div>
      )}

      {/* CASO 1: CAIXA FECHADO - SOLICITA ABERTURA */}
      {!activeSession && !closingResult && (
        <div className="card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', maxWidth: '500px', margin: '40px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Lock size={48} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px' }}>Abertura de Turno Requerida</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>O operador precisa abrir o caixa com o fundo de troco para iniciar as vendas do dia.</p>
          </div>

          <form onSubmit={handleOpenSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nome do Operador / Gerente *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Nome do Operador"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fundo de Troco Inicial (Preparo) *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 150,00"
                  value={openingValue}
                  onChange={e => setOpeningValue(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '14px', width: '100%', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px' }}
            >
              Abrir Caixa e Iniciar Vendas
            </button>
          </form>
        </div>
      )}

      {/* CASO 2: CAIXA ABERTO - MOSTRA PAINEL DO CAIXA E BUSCA DE COMANDA */}
      {activeSession && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PAINEL DE CONTROLE DE CAIXA */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operador Atual:</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'white' }}>{activeSession.operator_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Aberto às {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo Dinheiro Físico:</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--success)' }}>
                  R$ {cashInDrawer.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setMovementType('suprimento')}
                  style={{
                    background: 'rgba(76, 175, 80, 0.12)', color: 'var(--success)', border: '1px solid var(--success)',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                  }}
                  title="Colocar dinheiro para troco"
                >
                  <Plus size={14} /> Suprimento
                </button>

                <button 
                  onClick={() => setMovementType('sangria')}
                  style={{
                    background: 'rgba(244, 67, 54, 0.12)', color: 'var(--danger)', border: '1px solid var(--danger)',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                  }}
                  title="Retirar dinheiro em espécie por segurança"
                >
                  <Minus size={14} /> Sangria
                </button>

                <button 
                  onClick={() => setShowCloseModal(true)}
                  style={{
                    background: 'var(--border)', color: 'white', border: '1px solid var(--border)',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                  }}
                >
                  <Lock size={14} /> Fechar Caixa
                </button>
              </div>
            </div>

            {/* LISTA RESUMIDA DAS ÚLTIMAS MOVIMENTAÇÕES DE CAIXA */}
            {movements.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movimentações do Turno ({movements.length})</h4>
                <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {movements.slice(0, 5).map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-dark)' }}>
                      <div>
                        <span style={{ 
                          fontWeight: 'bold', marginRight: '8px',
                          color: m.type === 'suprimento' ? 'var(--success)' : m.type === 'sangria' ? 'var(--danger)' : 'var(--primary)'
                        }}>
                          {m.type === 'suprimento' ? 'SUPRIMENTO' : m.type === 'sangria' ? 'SANGRIA' : `VENDA (${m.method?.toUpperCase()})`}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{m.description}</span>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>
                        {m.type === 'sangria' ? '-' : '+'} R$ {m.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TELA DE SUCESSO DE PAGAMENTO */}
          {paymentSuccess && lastPaymentInfo && (
            <div className="card" style={{ textAlign: 'center', padding: '32px', borderLeft: '4px solid var(--success)', background: 'var(--bg-card)' }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Pagamento Realizado com Sucesso!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                A Comanda {lastPaymentInfo.comandaNumber} foi baixada e o valor de <strong>R$ {lastPaymentInfo.totalAmount.toFixed(2).replace('.', ',')}</strong> foi registrado no caixa.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="btn btn-outline" onClick={() => setPaymentSuccess(false)}>
                  Nova Consulta
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowStandardReceipt(true)}>
                  <Receipt size={18} /> Ver Comprovante (Simples)
                </button>
                {lastPaymentInfo.nfce_emitted && (
                  <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--success)' }} onClick={() => setShowFiscalReceipt(true)}>
                    <Printer size={18} /> Ver Cupom Fiscal (NFC-e)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DETALHES DA COMANDA SE ENCONTRADA (buscada via Aba Consultar Comanda) */}
          {searched && !paymentSuccess && (
            <>
              {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                  <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Nenhum pedido ativo ou pendente encontrado para a Comanda {comandaNumber}.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start', flexWrap: 'wrap' }}>
                  
                  {/* DETALHES DOS ITENS */}
                  <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginTop: 0 }}>
                      Pedidos da Comanda {comandaNumber}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {orders.map((order, oIdx) => (
                        <div key={order.id} style={{ borderBottom: oIdx < orders.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            <span>Mesa {order.table_session?.table_number ?? '?'}</span>
                            <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {order.items.map((item, iIdx) => (
                              <div key={iIdx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{item.quantity}x {item.product?.name ?? 'Item'}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                                </div>
                                {/* Mostrar informações fiscais para auditoria */}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                  <span>NCM: {item.product?.ncm || 'N/C'}</span>
                                  <span>CFOP: {item.product?.cfop || 'N/C'}</span>
                                  <span>Regime: {item.product?.regime_tributario || 'N/C'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '2px solid var(--border)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      <span>Total a Pagar:</span>
                      <span style={{ color: 'var(--primary)' }}>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* PARTE DE OPÇÕES DE PAGAMENTO */}
                  <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px', margin: 0 }}>Opções de Pagamento</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                      
                      {/* Seleção de método */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Forma de Recebimento</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <button
                            onClick={() => setPaymentMethod('dinheiro')}
                            style={{
                              padding: '10px 4px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
                              background: paymentMethod === 'dinheiro' ? 'var(--primary)' : 'var(--bg-dark)',
                              color: 'white', fontWeight: paymentMethod === 'dinheiro' ? 'bold' : 'normal'
                            }}
                          >
                            Dinheiro
                          </button>
                          <button
                            onClick={() => setPaymentMethod('pix')}
                            style={{
                              padding: '10px 4px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
                              background: paymentMethod === 'pix' ? 'var(--primary)' : 'var(--bg-dark)',
                              color: 'white', fontWeight: paymentMethod === 'pix' ? 'bold' : 'normal'
                            }}
                          >
                            PIX (QR POS)
                          </button>
                          <button
                            onClick={() => setPaymentMethod('cartao')}
                            style={{
                              padding: '10px 4px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
                              background: paymentMethod === 'cartao' ? 'var(--primary)' : 'var(--bg-dark)',
                              color: 'white', fontWeight: paymentMethod === 'cartao' ? 'bold' : 'normal'
                            }}
                          >
                            Cartão (POS)
                          </button>
                        </div>
                      </div>

                      {/* Fluxo de Calculadora de Troco para Dinheiro */}
                      {paymentMethod === 'dinheiro' && (
                        <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Valor Entregue pelo Cliente</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Ex: 100,00"
                              value={receivedCash}
                              onChange={e => setReceivedCash(e.target.value)}
                              style={{
                                width: '100%', padding: '8px 8px 8px 30px', borderRadius: '6px', border: '1px solid var(--border)',
                                background: 'var(--bg-card)', color: 'white', outline: 'none'
                              }}
                            />
                            <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>

                          {receivedCash && parseFloat(receivedCash) >= totalAmount && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 'bold' }}>
                              <span>Troco a devolver:</span>
                              <span>R$ {changeValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fluxo de NFC-e Checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={createNfce}
                          onChange={e => setCreateNfce(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                        <span>Emitir Cupom Fiscal (NFC-e)</span>
                      </label>

                      {/* Confirmar Pagamento Button */}
                      <button 
                        className="btn btn-primary" 
                        onClick={handlePay}
                        disabled={loading}
                        style={{ 
                          width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 'bold',
                          background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        <CheckCircle size={20} />
                        {loading ? 'Processando...' : 
                         paymentMethod === 'pix' ? 'Gerar QR Code PIX' :
                         paymentMethod === 'cartao' ? 'Enviar para Maquininha' : 
                         'Confirmar Recebimento'}
                      </button>

                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      )}



      </>)}

      {/* ===== ABA: CONSULTAR COMANDA ===== */}
      {activeTab === 'consulta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* BARRA DE BUSCA */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '6px', margin: 0 }}>Consultar Pedidos por Comanda</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '6px 0 16px' }}>Digite o número da comanda para visualizar todos os pedidos pendentes e o total a receber.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Número da comanda (ex: 15)"
                  value={consultaComanda}
                  onChange={e => setConsultaComanda(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && fetchConsultaOrders()}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none', fontSize: '1rem'
                  }}
                />
                <Receipt size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => fetchConsultaOrders()}
                disabled={consultaLoading || !consultaComanda}
                style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto' }}
              >
                <Search size={18} />
                {consultaLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {consultaError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '12px', marginBottom: 0 }}>{consultaError}</p>
            )}
          </div>

          {/* RESULTADO DA CONSULTA */}
          {consultaSearched && consultaOrders.length > 0 && (() => {
            const consultaTotal = consultaOrders.reduce((s, o) => s + o.total_amount, 0);
            const pendingOrders = consultaOrders.filter(o => o.status !== 'paid' && o.status !== 'canceled');
            const pendingTotal = pendingOrders.reduce((s, o) => s + o.total_amount, 0);
            return (
              <>
                {/* RESUMO */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total de Pedidos</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>{consultaOrders.length}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pendente a Pagar</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger)' }}>{pendingOrders.length}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total a Receber</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>R$ {pendingTotal.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>

                {/* LISTA DE PEDIDOS */}
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>Pedidos da Comanda #{consultaComanda}</h3>
                    <button
                      onClick={() => { setConsultaSearched(false); setConsultaOrders([]); setConsultaComanda(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      Limpar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {consultaOrders.map((order, oIdx) => (
                      <div key={order.id} style={{
                        border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden',
                        borderLeft: `4px solid ${getStatusColor(order.status)}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getStatusIcon(order.status)}
                            <span style={{ fontWeight: 'bold', fontSize: '0.88rem', color: getStatusColor(order.status) }}>{getStatusText(order.status)}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>— Mesa {order.table_session?.table_number ?? '?'}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {order.items.map((item, iIdx) => (
                            <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--text-main)' }}>{item.quantity}x {item.product?.name ?? 'Item'}</span>
                              <span style={{ color: 'var(--text-muted)' }}>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '8px', marginTop: '4px', borderTop: '1px dashed var(--border)', fontSize: '0.95rem' }}>
                            <span>Subtotal</span>
                            <span style={{ color: order.status === 'paid' ? 'var(--success)' : 'white' }}>R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL GERAL + AÇÃO */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>
                      <span>Total Pendente:</span>
                      <span style={{ color: 'var(--primary)' }}>R$ {pendingTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {pendingOrders.length > 0 && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setComandaNumber(consultaComanda);
                          fetchOrders(consultaComanda);
                          setActiveTab('pdv');
                        }}
                        style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <CheckCircle size={18} /> Ir para Pagamento desta Comanda
                      </button>
                    )}
                    {pendingOrders.length === 0 && (
                      <p style={{ color: 'var(--success)', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Todos os pedidos desta comanda já foram pagos.</p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}

      {/* ======================================================== */}
      {/* ======================= MODAIS ========================= */}
      {/* ======================================================== */}

      {/* MODAL 1: SUPRIMENTO / SANGRIA */}
      {movementType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', background: 'var(--bg-card)' }}>
            <button 
              onClick={() => setMovementType(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ color: movementType === 'suprimento' ? 'var(--success)' : 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {movementType === 'suprimento' ? <Plus size={20} /> : <Minus size={20} />}
              Registrar {movementType === 'suprimento' ? 'Suprimento' : 'Sangria'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
              {movementType === 'suprimento' ? 'Adicionar dinheiro na gaveta para troco.' : 'Retirar notas altas da gaveta por segurança.'}
            </p>
            
            <form onSubmit={handleRegisterMovement} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Valor (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 50,00"
                  value={movementAmount}
                  onChange={e => setMovementAmount(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Observação / Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Troco inicial ou Sangria meio dia"
                  value={movementDescription}
                  onChange={e => setMovementDescription(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: 'white', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMovementType(null)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={movementLoading}
                  style={{ flex: 1, background: movementType === 'suprimento' ? 'var(--success)' : 'var(--danger)', color: 'white', border: 'none' }}
                >
                  {movementLoading ? 'Gravando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FECHAMENTO CEGO DE CAIXA */}
      {showCloseModal && activeSession && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '24px', position: 'relative', background: 'var(--bg-card)' }}>
            <button 
              onClick={() => setShowCloseModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Lock size={20} /> Fechamento de Caixa Cego
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              O sistema não revela o saldo esperado para maior controle. Conte fisicamente os valores na gaveta e digite abaixo.
            </p>

            <form onSubmit={handleCloseSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Total em Dinheiro Físico Contado *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Contagem física de notas/moedas"
                    value={declaredCash}
                    onChange={e => setDeclaredCash(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 10px 10px 30px', borderRadius: '6px', border: '1px solid var(--border)',
                      background: 'var(--bg-dark)', color: 'white', outline: 'none'
                    }}
                    required
                  />
                  <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Total em Comprovantes de Cartão Contado *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Soma dos canhotos de cartão/Smart POS"
                    value={declaredCards}
                    onChange={e => setDeclaredCards(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 10px 10px 30px', borderRadius: '6px', border: '1px solid var(--border)',
                      background: 'var(--bg-dark)', color: 'white', outline: 'none'
                    }}
                    required
                  />
                  <CreditCard size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCloseModal(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none' }}
                >
                  Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SIMULAÇÃO PIX DINÂMICO */}
      {showPixModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.96)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            
            {pixStatus === 'generating' && (
              <div>
                <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <h4 style={{ margin: 0 }}>Gerando PIX Dinâmico</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Enviando requisição de R$ {totalAmount.toFixed(2).replace('.', ',')} para o banco...</p>
              </div>
            )}

            {pixStatus === 'waiting' && (
              <div>
                <h4 style={{ margin: '0 0 16px', color: 'var(--primary)' }}>Pague com o PIX QR Code</h4>
                
                {/* Visual QR Code mock */}
                <div style={{
                  background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226850014br.gov.bcb.pix2563pix-restaurante-cmbdesign.com.br/v2/pagamento-${Date.now()}5204000053039865405${totalAmount.toFixed(2)}5802BR5917CMB_RESTAURANTE_LTDA`}
                    alt="PIX QR Code"
                    style={{ width: '180px', height: '180px', display: 'block' }}
                  />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                  Restaurante CMB Design
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '16px' }}>
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </div>

                <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div className="pulsing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9800', animation: 'pulse 1.2s infinite' }}></div>
                  Aguardando notificação de pagamento instantânea...
                </div>
              </div>
            )}

            {pixStatus === 'paid' && (
              <div>
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ margin: 0, color: 'var(--success)' }}>PIX Recebido!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Operação validada pelo Banco Central.</p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* MODAL 5: SIMULAÇÃO SMART POS (CARTÃO) */}
      {showCardModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.96)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            
            <CreditCard size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            
            {cardStatus === 'waiting' && (
              <div>
                <h4 style={{ margin: 0 }}>Insira ou Aproxime o Cartão</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                  Valor enviado para maquininha Smart POS: <br />
                  <strong style={{ fontSize: '1.2rem', color: 'white', display: 'block', marginTop: '4px' }}>R$ {totalAmount.toFixed(2).replace('.', ',')}</strong>
                </p>
              </div>
            )}

            {cardStatus === 'reading' && (
              <div>
                <h4 style={{ margin: 0 }}>Lendo Cartão / Processando...</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Não remova o cartão da maquininha...</p>
                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '16px auto 0' }}></div>
              </div>
            )}

            {cardStatus === 'approved' && (
              <div>
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ margin: 0, color: 'var(--success)' }}>Transação Aprovada!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Imprimindo via do cliente...</p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* MODAL 5.5: IMPRESSÃO DE COMPROVANTE SIMPLES */}
      {showStandardReceipt && lastPaymentInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.97)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
            <button 
              onClick={() => setShowStandardReceipt(false)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={20} /> Fechar
            </button>

            <div className="print-area" style={{ 
              background: 'white', color: '#111', padding: '24px 20px', borderRadius: '4px',
              fontFamily: '"Courier New", Courier, monospace', fontSize: '0.85rem', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              maxHeight: '80vh', overflowY: 'auto'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div>========================================</div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', margin: '4px 0' }}>RESTAURANTE CMB DESIGN</div>
                <div>========================================</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Data: {lastPaymentInfo.date.split(' ')[0] || new Date().toLocaleDateString()}</span>
                <span>Hora: {lastPaymentInfo.date.split(' ')[1] || new Date().toLocaleTimeString().slice(0,5)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Pedido/Comanda: #{lastPaymentInfo.comandaNumber}</span>
                <span>Mesa: {lastPaymentInfo.orders[0]?.table_session?.table_number || '?'}</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '4px' }}>----------------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ width: '40px' }}>QTD</span>
                <span style={{ flex: 1 }}>ITEM</span>
                <span style={{ width: '50px', textAlign: 'right' }}>V.UN</span>
                <span style={{ width: '60px', textAlign: 'right' }}>TOTAL</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>----------------------------------------</div>

              {lastPaymentInfo.orders.flatMap((order, oIdx) => 
                order.items.map((item, iIdx) => (
                  <div key={`${oIdx}-${iIdx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ width: '40px' }}>{item.quantity}x</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name ?? 'Item'}</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>{item.unit_price.toFixed(2)}</span>
                    <span style={{ width: '60px', textAlign: 'right' }}>{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))
              )}

              <div style={{ textAlign: 'center', margin: '8px 0' }}>----------------------------------------</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>{lastPaymentInfo.totalAmount.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div style={{ textAlign: 'center', margin: '8px 0' }}>----------------------------------------</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.95rem' }}>
                <span>TOTAL PAGO:</span>
                <span>{lastPaymentInfo.totalAmount.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div style={{ textAlign: 'center', margin: '8px 0' }}>----------------------------------------</div>
              
              <div style={{ marginBottom: '12px' }}>
                Forma de Pgto: {lastPaymentInfo.paymentMethod === 'dinheiro' ? 'Dinheiro' : lastPaymentInfo.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div>========================================</div>
                <div style={{ margin: '4px 0' }}>* Este documento não é nota fiscal. *</div>
                <div style={{ margin: '4px 0' }}>Obrigado pela preferência!</div>
                <div>========================================</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                className="btn btn-outline"
                style={{ flex: 1, color: 'white', borderColor: 'white' }}
                onClick={() => setShowStandardReceipt(false)}
              >
                Voltar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => window.print()}
              >
                <Printer size={18} /> Imprimir Comprovante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: IMPRESSÃO DE CUPOM FISCAL (NFC-e) */}
      {showFiscalReceipt && lastPaymentInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 12, 0.97)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
            
            {/* Botão de Fechar */}
            <button 
              onClick={() => setShowFiscalReceipt(false)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={20} /> Fechar
            </button>

            {/* Recibo Térmico */}
            <div className="print-area" style={{ 
              background: 'white', color: '#111', padding: '24px 20px', borderRadius: '4px',
              fontFamily: '"Courier New", Courier, monospace', fontSize: '0.78rem', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              maxHeight: '80vh', overflowY: 'auto', border: '1px dashed #ccc'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px dashed #555', paddingBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>RESTAURANTE CMB DESIGN</div>
                <div>CMB DESIGN ALIMENTOS LTDA</div>
                <div>AVENIDA PAULISTA, 1000 - BELA VISTA</div>
                <div>SÃO PAULO - SP - CEP: 01310-100</div>
                <div>CNPJ: 12.345.678/0001-99 | IE: 111.222.333.444</div>
                <div style={{ margin: '8px 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
                </div>
                <div>Não permite aproveitamento de crédito de ICMS</div>
              </div>

              {/* Itens do Cupom */}
              <div style={{ borderBottom: '1px dashed #555', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>ITEM DESCRIÇÃO</span>
                  <span>QTDxV.UNT = TOTAL</span>
                </div>
                {lastPaymentInfo.orders.flatMap((order, oIdx) => 
                  order.items.map((item, iIdx) => (
                    <div key={`${oIdx}-${iIdx}`} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{(item.product?.name ?? 'Item').toUpperCase()}</span>
                        <span>{item.quantity}xR$ {item.unit_price.toFixed(2)} = R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                      <div style={{ color: '#666', fontSize: '0.7rem', paddingLeft: '4px' }}>
                        NCM: {item.product?.ncm || '2202.10.00'} | CFOP: {item.product?.cfop || '5.102'} | REG: {item.product?.regime_tributario || 'ST'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totais */}
              <div style={{ borderBottom: '1px dashed #555', paddingBottom: '8px', marginBottom: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>QTD. TOTAL DE ITENS</span>
                  <span>{lastPaymentInfo.orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.95rem', margin: '4px 0' }}>
                  <span>VALOR TOTAL R$</span>
                  <span>R$ {lastPaymentInfo.totalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>FORMA DE PAGAMENTO</span>
                  <span>{lastPaymentInfo.paymentMethod === 'dinheiro' ? 'DINHEIRO' : lastPaymentInfo.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO'}</span>
                </div>
              </div>

              {/* Dados Fiscais SEFAZ */}
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Consulte pela Chave de Acesso em:</div>
                <div style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
                  https://www.nfe.fazenda.gov.br/portal
                </div>
                <div style={{ fontWeight: 'bold', margin: '4px 0', fontSize: '0.78rem' }}>
                  CHAVE DE ACESSO: <br />
                  {lastPaymentInfo.nfce_access_key?.match(/.{1,4}/g)?.join(' ') ?? 'MOCK ACCESS KEY'}
                </div>
                <div>CONSUMIDOR NÃO IDENTIFICADO</div>
                <div>NFC-e nº 000188 Série 001 - Emissão: {lastPaymentInfo.date}</div>
                <div>Protocolo de Autorização: 135260000499252</div>

                {/* QR Code SEFAZ para Escaneamento do Cliente */}
                <div style={{ margin: '12px auto 0', background: 'white', padding: '8px', border: '1px solid #ddd', display: 'inline-block' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.sefaz.sp.gov.br/nfce/qrcode?p=${lastPaymentInfo.nfce_access_key}|2|1|1|MOCKCHECK`}
                    alt="SEFAZ QR Code"
                    style={{ width: '120px', height: '120px', display: 'block' }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', marginTop: '4px', color: '#777' }}>
                  Consulta via leitor de QR Code do celular
                </div>
              </div>
            </div>

            {/* Ações de Impressão */}
            <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                className="btn btn-outline"
                style={{ flex: 1, color: 'white', borderColor: 'white' }}
                onClick={() => setShowFiscalReceipt(false)}
              >
                Voltar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={18} /> Imprimir Cupom
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS INLINE ADICIONAIS PARA SUPORTAR SPINNERS E ANIMAÇÕES */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.4; transform: scale(0.9); }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          /* Apenas a nota fiscal é visível na impressão */
          div[style*="font-family: \\"Courier New\\""], div[style*="font-family: \\"Courier New\\""] * {
            visibility: visible;
          }
          div[style*="font-family: \\"Courier New\\""] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}
