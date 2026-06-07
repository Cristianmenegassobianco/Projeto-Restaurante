import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
export default function Header({ title, showBack = false, bgColor, textColor }) {
  const navigate = useNavigate();

  return (
    <header className="header" style={{ backgroundColor: bgColor, color: textColor }}>
      <div style={{ width: '40px' }}>
        {showBack && (
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: textColor || 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      
      <h2 style={{ fontSize: '1.2rem', textAlign: 'center', flex: 1 }}>{title}</h2>
      
      <div style={{ width: '40px' }}></div>
    </header>
  );
}
