import React from 'react';
import { BookOpen, ShieldAlert, Play, Square, Headphones, Music } from 'lucide-react';

interface HeaderProps {
  activeTab: 'console' | 'academy' | 'mistakes';
  setActiveTab: (tab: 'console' | 'academy' | 'mistakes') => void;
  isPlaying: boolean;
  togglePlay: () => void;
  isAudioReady: boolean;
  activeMistakesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  togglePlay,
  isAudioReady,
  activeMistakesCount,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 12px 12px', borderTop: 'none', borderInline: 'none' }}>
      
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            padding: '8px',
            borderRadius: '8px',
            color: '#070a12',
            boxShadow: isPlaying ? '0 0 15px rgba(0, 242, 254, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isPlaying ? 'pulse-glow 1.5s infinite ease-in-out' : 'none'
          }}
        >
          <Headphones size={20} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            SOUNDLAB
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(0, 242, 254, 0.1)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>ACADEMY</span>
          </h1>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Interactive Mixing & Mastering Studio</span>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('console')}
          style={{
            background: activeTab === 'console' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'console' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'console' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Music size={14} style={{ color: activeTab === 'console' ? 'var(--accent-cyan)' : 'inherit' }} />
          Studio Console
        </button>

        <button
          onClick={() => setActiveTab('academy')}
          style={{
            background: activeTab === 'academy' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'academy' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'academy' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={14} style={{ color: activeTab === 'academy' ? 'var(--color-vocals)' : 'inherit' }} />
          Mixing Academy
        </button>

        <button
          onClick={() => setActiveTab('mistakes')}
          style={{
            background: activeTab === 'mistakes' ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'mistakes' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'mistakes' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          <ShieldAlert size={14} style={{ color: activeTab === 'mistakes' ? '#f87171' : 'inherit' }} />
          Mistake Simulator
          {activeMistakesCount > 0 && (
            <span 
              style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                backgroundColor: '#ef4444', 
                color: '#fff', 
                fontSize: '8px', 
                width: '14px', 
                height: '14px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 0 5px #ef4444'
              }}
            >
              {activeMistakesCount}
            </span>
          )}
        </button>
      </nav>

      {/* Quick Playback Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAudioReady && (
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '14px' }}>
            <div className="wave-bar" style={{ width: '2px', height: '14px', backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-muted)', animationDelay: '0.1s' }} />
            <div className="wave-bar" style={{ width: '2px', height: '14px', backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-muted)', animationDelay: '0.3s' }} />
            <div className="wave-bar" style={{ width: '2px', height: '14px', backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-muted)', animationDelay: '0.2s' }} />
            <div className="wave-bar" style={{ width: '2px', height: '14px', backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-muted)', animationDelay: '0.4s' }} />
          </div>
        )}
        <button
          onClick={togglePlay}
          style={{
            background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: '1px solid',
            borderColor: isPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            color: isPlaying ? '#ef4444' : '#10b981',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isPlaying ? 'Stop playback' : 'Start playback'}
        >
          {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>
      </div>

    </header>
  );
};
