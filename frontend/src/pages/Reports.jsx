import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, RefreshCw, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros de data (YYYY-MM-DD)
  // Use toLocaleDateString('en-CA') to get YYYY-MM-DD in local time
  const today = new Date().toLocaleDateString('en-CA');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `/api/reports/dashboard?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Erro ao buscar relatórios.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao buscar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatCurrency = (val) => `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)' }}>
      
      {/* FILTROS E CABEÇALHO */}
      <div className="card no-print" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'var(--bg-card)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} /> Relatório Gerencial
          </h2>
          <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Filtre as informações do seu restaurante.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'white', marginBottom: '4px' }}>Data Inicial</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: '#212322', fontWeight: 'bold' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'white', marginBottom: '4px' }}>Data Final</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: '#212322', fontWeight: 'bold' }}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={fetchReports} 
            disabled={loading}
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            Atualizar
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={handlePrint}
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}
          >
            <Download size={18} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando dados...</div>
      ) : data ? (
        <div className="print-area">
          <div className="only-print" style={{ display: 'none', marginBottom: '20px', textAlign: 'center' }}>
            <h2>Relatório Gerencial do Restaurante</h2>
            <p>Período: {new Date(data.interval.start).toLocaleDateString()} a {new Date(data.interval.end).toLocaleDateString()}</p>
            <hr />
          </div>

          {/* TOTALIZADORES ABERTURA DE CAIXA (Sempre acumulado no tempo real) */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--primary)" /> Fundo de Troco (Aberturas de Caixa)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: '20px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)', borderLeft: '4px solid #2196f3' }}>
              <div style={{ fontSize: '0.85rem', color: 'white' }}>Aberturas do Dia (Hoje)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(data.cashOpenings?.today || 0)}</div>
            </div>
            <div className="card" style={{ padding: '20px', background: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)', borderLeft: '4px solid #9c27b0' }}>
              <div style={{ fontSize: '0.85rem', color: 'white' }}>Aberturas da Semana</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(data.cashOpenings?.week || 0)}</div>
            </div>
            <div className="card" style={{ padding: '20px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)', borderLeft: '4px solid #ff9800' }}>
              <div style={{ fontSize: '0.85rem', color: 'white' }}>Aberturas do Mês</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(data.cashOpenings?.month || 0)}</div>
            </div>
          </div>

          {/* RESULTADO DO PERÍODO PESQUISADO */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--success)" /> Desempenho no Período Selecionado
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            
            <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.9rem', color: 'white' }}>Total de Vendas Feitas (Recebido)</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '8px 0' }}>
                {formatCurrency(data.sales.total)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'white' }}>Referente a {data.sales.list.length} pedido(s) pagos.</div>
            </div>

            <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.9rem', color: 'white' }}>Valores em Caixa (Movimentações)</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Entradas (Vendas + Suprimentos):</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrency(data.movements.totalIn)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Saídas (Sangrias):</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrency(data.movements.totalOut)}</span>
                </div>
                <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}>
                  <span>Saldo Líquido Registrado:</span>
                  <span>{formatCurrency(data.movements.totalIn - data.movements.totalOut)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE VENDAS */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} /> Detalhamento de Pedidos (Vendas)
            </h3>
            
            {data.sales.list.length === 0 ? (
              <p style={{ color: 'white', textAlign: 'center', padding: '20px 0' }}>Nenhuma venda registrada neste período.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', color: 'white' }}>Data / Hora</th>
                      <th style={{ padding: '12px 8px', color: 'white' }}>Comanda</th>
                      <th style={{ padding: '12px 8px', color: 'white' }}>Método</th>
                      <th style={{ padding: '12px 8px', color: 'white' }}>Status</th>
                      <th style={{ padding: '12px 8px', color: 'white', textAlign: 'right' }}>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.list.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px' }}>{new Date(order.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{order.comanda_number || '-'}</td>
                        <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{order.payment_method || '-'}</td>
                        <td style={{ padding: '12px 8px' }}><span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Pago</span></td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(order.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : null}

      {/* Adicionar uma classe print globalmente injetada caso não exista */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          .card { border: none !important; box-shadow: none !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
