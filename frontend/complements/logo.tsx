// frontend/components/logo.tsx
import React from 'react';

interface LogoProps {
  showText?: boolean; 
}

export const Logo = ({ showText = true }: LogoProps) => (
  <div style={{ textAlign: 'center', marginBottom: '35px' }}>
    <div style={{ margin: '0 auto 15px', width: '80px', height: '80px' }}>
      <svg 
        width="80" 
        height="80" 
        viewBox="0 0 110 110" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          borderRadius: '20px',
          filter: 'drop-shadow(0 8px 24px rgba(0, 200, 80, 0.45))'
        }}
      >
        <rect width="110" height="110" rx="22" fill="#0D2137"/>
        <line x1="55" y1="55" x2="85" y2="22" stroke="#00FF6A" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="55" y1="55" x2="18" y2="55" stroke="#00FF6A" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="55" y1="55" x2="85" y2="88" stroke="#00FF6A" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
        <circle cx="90" cy="18" r="13" fill="#00FF6A"/>
        <circle cx="14" cy="55" r="13" fill="#00FF6A"/>
        <circle cx="90" cy="92" r="13" fill="#00FF6A"/>
        <circle cx="55" cy="55" r="22" fill="#163352"/>
        <circle cx="55" cy="55" r="22" stroke="#00FF6A" strokeWidth="2" fill="none" opacity="0.35"/>
        <circle cx="55" cy="49" r="7" fill="white"/>
        <path d="M 40,70 Q 40,60 55,60 Q 70,60 70,70" fill="white"/>
      </svg>
    </div>
  </div>
);