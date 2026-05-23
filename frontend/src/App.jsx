import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import Header from './components/Header';
import useStore from './store/useStore';

const PrivateRoute = ({ children }) => {
  const session = useStore(state => state.session);
  return session ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Redireciona /menu antigo para a nova home */}
        <Route path="/menu" element={<Navigate to="/" replace />} />
        
        <Route path="/product/:id" element={
          <>
            <Header title="Detalhes" showBack={true} showCart={true} />
            <Product />
          </>
        } />
        
        <Route path="/cart" element={
          <PrivateRoute>
            <Header title="Minha Comanda" showBack={true} />
            <Cart />
          </PrivateRoute>
        } />

        <Route path="/orders" element={
          <PrivateRoute>
            <Header title="Meus Pedidos" showBack={true} />
            <Orders />
          </PrivateRoute>
        } />

        {/* Rota da Cozinha (não precisa de sessão de mesa) */}
        <Route path="/kitchen" element={<Kitchen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
