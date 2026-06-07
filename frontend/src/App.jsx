import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Product from './pages/Product';
import Kitchen from './pages/Kitchen';
import Payment from './pages/Payment';
import Admin from './pages/Admin';
import Category from './pages/Category';
import Waiter from './pages/Waiter';
import Header from './components/Header';
import ClientPage1 from './pages/ClientPage1';
import ClientPage2 from './pages/ClientPage2';
import ClientPage3 from './pages/ClientPage3';

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#212322',
            color: '#F2EEDF',
            border: '1px solid #511F26',
            fontFamily: '"Outfit", sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#C0AAB1',
              secondary: '#212322',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />

        {/* Redireciona /menu antigo para a nova home */}
        <Route path="/menu" element={<Navigate to="/" replace />} />

        <Route path="/product/:id" element={
          <>
            <Header title="Detalhes" showBack={true} bgColor="#212322" textColor="#F2EEDF" />
            <Product />
          </>
        } />

        {/* Rota da Categoria (Ver Mais) */}
        <Route path="/category/:id" element={
          <>
            <Header title="Categoria" showBack={true} bgColor="#212322" textColor="#F2EEDF" />
            <Category />
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

        {/* Páginas de teste de design para o cliente */}
        <Route path="/cliente-1" element={<ClientPage1 />} />
        <Route path="/cliente-2" element={<ClientPage2 />} />
        <Route path="/cliente-3" element={<ClientPage3 />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
