import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/api/menu')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Carregando cardápio...</div>;
  }

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {categories.map(category => (
        <div key={category.id} className="mb-4">
          <h2 style={{ marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            {category.name}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {category.products.map(product => (
              <div 
                key={product.id} 
                className="card flex gap-4" 
                style={{ cursor: 'pointer', padding: '12px' }}
                onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
              >
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{product.name}</h3>
                    <p style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>
                  </div>
                  <div className="font-bold mt-4">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
