import { useState } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { MixingConsole } from './components/MixingConsole';
import { TrackControls } from './components/TrackControls';
import { LessonSection } from './components/LessonSection';
import { MistakeSimulator } from './components/MistakeSimulator';
import { Headphones, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'academy' | 'mistakes'>('console');
  
  // Initialize the audio engine hook
  const {
    isPlaying,
    isAudioReady,
    tracks,
    master,
    mistakes,
    selectedTrackId,
    peakLevels,
    analyserNode,
    initAudio,
    togglePlay,
    setSelectedTrackId,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    updateTrackEQ,
    updateTrackCompressor,
    updateTrackSends,
    updateMasterVolume,
    toggleMistake,
    clearAllMistakes,
    loadPreset
  } = useAudioEngine();

  // Count active errors
  const activeMistakesCount = Object.values(mistakes).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: '20px' }}>
      
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        isAudioReady={isAudioReady}
        activeMistakesCount={activeMistakesCount}
      />

      <main className="container" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
        
        {/* Headphones Recommendation Alert */}
        <div 
          style={{ 
            background: 'rgba(0, 242, 254, 0.05)', 
            border: '1px solid rgba(0, 242, 254, 0.15)', 
            borderRadius: '8px', 
            padding: '12px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Headphones size={22} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            <strong style={{ color: '#fff' }}>Recommended: Use Headphones!</strong> Mixing is about minute details. To hear the stereo separation, subtle compression, low-end cleanup, and physical phase cancellation, headphones are highly recommended.
          </div>
        </div>

        {/* ACTIVE TAB RENDER */}
        
        {activeTab === 'console' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Master output visuals */}
            <Visualizer 
              analyserNode={analyserNode}
              isPlaying={isPlaying}
            />

            {/* Warning if mistakes are injected */}
            {activeMistakesCount > 0 && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                  borderRadius: '8px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#f87171' }}>
                  <ShieldAlert size={18} />
                  <span>
                    <strong>Warning:</strong> You currently have {activeMistakesCount} ear-training mistake{activeMistakesCount > 1 ? 's' : ''} active. The sound and graphs reflect this!
                  </span>
                </div>
                <button 
                  onClick={clearAllMistakes}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  CLEAR ALL MISTAKES
                </button>
              </div>
            )}

            {/* Mixing Desk Grid */}
            <MixingConsole
              tracks={tracks}
              master={master}
              peakLevels={peakLevels}
              selectedTrackId={selectedTrackId}
              setSelectedTrackId={setSelectedTrackId}
              updateTrackVolume={updateTrackVolume}
              updateTrackPan={updateTrackPan}
              toggleTrackMute={toggleTrackMute}
              toggleTrackSolo={toggleTrackSolo}
              updateMasterVolume={updateMasterVolume}
              isPlaying={isPlaying}
              togglePlay={togglePlay}
              isAudioReady={isAudioReady}
            />

            {/* EQ / Compressor Controls */}
            {isAudioReady && (
              <TrackControls
                track={tracks[selectedTrackId]}
                updateTrackEQ={updateTrackEQ}
                updateTrackCompressor={updateTrackCompressor}
                updateTrackSends={updateTrackSends}
              />
            )}
            
            {/* Quick guide for console if not initialized */}
            {!isAudioReady && (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Volume2 size={36} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#fff' }}>Welcome to the Interactive SoundLab Mixer</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' }}>
                  This interface simulates a professional recording studio DAW console. Click **PLAY MIX** above to start the programmatic audio synthesis engine and hear the multi-track vocal, guitar, bass, and drum loops in real-time.
                </p>
                <button className="btn btn-primary" onClick={initAudio} style={{ marginTop: '10px' }}>
                  TURN ON CONSOLE ENGINE
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'academy' && (
          <LessonSection
            loadPreset={loadPreset}
            setSelectedTrackId={setSelectedTrackId}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeSimulator
            mistakes={mistakes}
            toggleMistake={toggleMistake}
            clearAllMistakes={clearAllMistakes}
            isPlaying={isPlaying}
          />
        )}

      </main>

      {/* Footer */}
      <footer 
        style={{ 
          borderTop: '1px solid var(--border)', 
          background: 'rgba(7, 10, 18, 0.95)',
          padding: '24px 0', 
          color: 'var(--text-muted)', 
          fontSize: '12px',
          textAlign: 'center',
          marginTop: 'auto'
        }}
      >
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={12} /> Synthesized Web Audio DSP</span>
            <span>•</span>
            <span>No Cookies or Tracking</span>
            <span>•</span>
            <span>Created for Audio Training</span>
          </div>
          <p>© 2026 SoundLab Academy. All rights reserved. Run entirely client-side in the browser.</p>
        </div>
      </footer>

    </div>
  );
}

export default App;
