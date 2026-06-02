import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Product from './pages/Product';
import Kitchen from './pages/Kitchen';
import Payment from './pages/Payment';
import Admin from './pages/Admin';
import Waiter from './pages/Waiter';
import Header from './components/Header';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Redireciona /menu antigo para a nova home */}
        <Route path="/menu" element={<Navigate to="/" replace />} />

        <Route path="/product/:id" element={
          <>
            <Header title="Detalhes" showBack={true} />
            <Product />
          </>
        } />

        {/* Rota da Cozinha (não precisa de sessão de mesa) */}
        <Route path="/kitchen" element={<Kitchen />} />

        {/* Rota de Pagamento (Caixa) */}
        <Route path="/payment" element={<Payment />} />


        {/* Rota do Garçom */}
        <Route path="/waiter" element={<Waiter />} />

        {/* Rota de Gerenciamento Unificado (Admin) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
