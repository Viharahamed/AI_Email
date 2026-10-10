import React from 'react';
import { useApp } from '../context/AppContext';

export const FloatingRobotButton: React.FC = () => {
  const { toggleAssistant, isAssistantOpen } = useApp();

  return (
    <button
      onClick={toggleAssistant}
      aria-label="Open AI Assistant"
      title="Open Aura AI Assistant"
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:outline-none ${
        isAssistantOpen
          ? 'ring-4 ring-purple-400/60 scale-105 shadow-purple-500/30'
          : 'hover:scale-110 active:scale-95 hover:shadow-sky-500/30'
      }`}
      style={{
        background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
      }}
    >
      {/* Friendly Robot Avatar SVG (White body, dark screen, glowing cyan smile & eyes) */}
      <svg
        viewBox="0 0 100 100"
        className="w-10 h-10 object-contain drop-shadow-md transition-transform duration-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antennas */}
        <line x1="38" y1="20" x2="32" y2="12" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="30" cy="10" r="4.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2" />

        <line x1="62" y1="20" x2="68" y2="12" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="10" r="4.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2" />

        {/* Outer White Helmet Head */}
        <rect x="16" y="20" width="68" height="52" rx="22" fill="#FFFFFF" />

        {/* Black Face Screen */}
        <rect x="24" y="27" width="52" height="38" rx="14" fill="#0F172A" />

        {/* Glowing Cyan Eyes (Happy Curves) */}
        <path d="M 33 42 Q 40 34 45 42" stroke="#22D3EE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 55 42 Q 60 34 67 42" stroke="#22D3EE" strokeWidth="4.5" strokeLinecap="round" fill="none" />

        {/* Glowing Cyan Smile */}
        <path d="M 42 52 Q 50 60 58 52" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* White Robot Body Top & Heart Emblem */}
        <path d="M 30 72 L 70 72 L 64 88 L 36 88 Z" fill="#FFFFFF" />
        <path d="M 50 76 C 48 73 44 73 43 76 C 42 79 47 83 50 85 C 53 83 58 79 57 76 C 56 73 52 73 50 76 Z" fill="#22D3EE" />
      </svg>
    </button>
  );
};
