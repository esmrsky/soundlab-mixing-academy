import React, { useRef } from 'react';
import type { TrackId, TrackState, MasterState } from '../hooks/useAudioEngine';
import { Volume2, Mic, Music, Disc, Activity } from 'lucide-react';

interface MixingConsoleProps {
  tracks: Record<TrackId, TrackState>;
  master: MasterState;
  peakLevels: Record<TrackId | 'master', number>;
  selectedTrackId: TrackId;
  setSelectedTrackId: (id: TrackId) => void;
  updateTrackVolume: (id: TrackId, vol: number) => void;
  updateTrackPan: (id: TrackId, pan: number) => void;
  toggleTrackMute: (id: TrackId) => void;
  toggleTrackSolo: (id: TrackId) => void;
  updateMasterVolume: (vol: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  isAudioReady: boolean;
}

// Custom Drag-to-Turn Rotary Knob Component
interface RotaryKnobProps {
  value: number; // -1 to 1
  label: string;
  onChange: (val: number) => void;
  color?: string;
}

const RotaryKnob: React.FC<RotaryKnobProps> = ({ value, label, onChange, color = '#00f2fe' }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaY = startY.current - e.clientY; // drag up increases value
    const sensitivity = 0.01; // speed of dial turn
    let newValue = startValue.current + deltaY * sensitivity;
    newValue = Math.max(-1, Math.min(1, newValue)); // clamp to [-1, 1]
    onChange(parseFloat(newValue.toFixed(2)));
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Convert -1..1 to -135deg..135deg rotation angle
  const rotationAngle = value * 135;

  return (
    <div className="rotary-knob-container">
      <div 
        ref={knobRef}
        className="rotary-knob"
        onMouseDown={handleMouseDown}
        style={{ '--accent-cyan': color } as React.CSSProperties}
        title="Drag up/down to adjust panning"
      >
        <div 
          className="rotary-knob-pointer"
          style={{ 
            transform: `rotate(${rotationAngle}deg)`,
            backgroundColor: color,
            boxShadow: `0 0 5px ${color}`
          }}
        />
      </div>
      <span className="knob-label">{label}</span>
      <span style={{ fontSize: '9px', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
        {value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`}
      </span>
    </div>
  );
};

export const MixingConsole: React.FC<MixingConsoleProps> = ({
  tracks,
  master,
  peakLevels,
  selectedTrackId,
  setSelectedTrackId,
  updateTrackVolume,
  updateTrackPan,
  toggleTrackMute,
  toggleTrackSolo,
  updateMasterVolume,
  isPlaying,
  togglePlay,
  isAudioReady,
}) => {

  const getTrackIcon = (id: TrackId) => {
    switch (id) {
      case 'vocals': return <Mic size={16} />;
      case 'guitar': return <Music size={16} />;
      case 'drums': return <Disc size={16} />;
      case 'bass': return <Activity size={16} />;
    }
  };

  const getTrackColor = (id: TrackId) => {
    return `var(--color-${id})`;
  };

  const getTrackGlow = (id: TrackId) => {
    return `var(--color-${id}-glow)`;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPlaying ? '#10b981' : '#ef4444', boxShadow: isPlaying ? '0 0 8px #10b981' : 'none' }}></span>
            Mixing Desk Console
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Select any track to adjust its parametric EQ and compressor chain.
          </p>
        </div>

        <button 
          className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`} 
          onClick={togglePlay}
          style={{ width: '130px', justifyContent: 'center' }}
        >
          {isPlaying ? 'STOP MIX' : 'PLAY MIX'}
        </button>
      </div>

      {!isAudioReady && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', border: '1px dashed var(--border)', borderRadius: '8px', gap: '10px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Studio Console is Offline</p>
          <button className="btn btn-primary" onClick={togglePlay}>Initialize Studio Engine</button>
        </div>
      )}

      {isAudioReady && (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr) 2px 100px', 
            gap: '16px',
            alignItems: 'stretch',
            marginTop: '10px'
          }}
        >
          {/* TRACK CHANNELS */}
          {(Object.keys(tracks) as TrackId[]).map(id => {
            const track = tracks[id];
            const isSelected = selectedTrackId === id;
            const trackColor = getTrackColor(id);
            const trackGlow = getTrackGlow(id);

            return (
              <div 
                key={id}
                onClick={() => setSelectedTrackId(id)}
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? trackColor : 'var(--border)',
                  boxShadow: isSelected ? `0 0 15px ${trackGlow}` : 'none',
                  borderRadius: '10px',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Header label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                  <span style={{ color: trackColor }}>{getTrackIcon(id)}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                    {track.name}
                  </span>
                </div>

                {/* Pan Dial */}
                <RotaryKnob 
                  value={track.pan} 
                  label="PAN" 
                  onChange={(val) => updateTrackPan(id, val)}
                  color={trackColor}
                />

                {/* Solo & Mute section */}
                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackSolo(id);
                    }}
                    style={{
                      width: '26px',
                      height: '22px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: track.solo ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                      background: track.solo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: track.solo ? '#f59e0b' : 'var(--text-secondary)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: track.solo ? '0 0 8px rgba(245, 158, 11, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title="Solo track"
                  >
                    S
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackMute(id);
                    }}
                    style={{
                      width: '26px',
                      height: '22px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: track.mute ? '#ef4444' : 'rgba(255,255,255,0.1)',
                      background: track.mute ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: track.mute ? '#ef4444' : 'var(--text-secondary)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: track.mute ? '0 0 8px rgba(239, 68, 68, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title="Mute track"
                  >
                    M
                  </button>
                </div>

                {/* Level Meter and Volume Fader row */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', height: '190px' }}>
                  {/* VU Level Meter */}
                  <div className="level-meter-bg">
                    <div 
                      className="level-meter-fill"
                      style={{ 
                        height: `${peakLevels[id] * 100}%`,
                      }}
                    />
                  </div>

                  {/* Volume Slider (vertical wrapper) */}
                  <div className="vertical-fader">
                    <input 
                      type="range"
                      min="0"
                      max="1.2"
                      step="0.01"
                      value={track.volume}
                      onChange={(e) => updateTrackVolume(id, parseFloat(e.target.value))}
                      className="fader-input"
                      style={{ 
                        '--track-color': trackColor,
                        // Set current slider track color dynamically
                        background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${track.volume * 83}%, rgba(255,255,255,0.1) ${track.volume * 83}%, rgba(255,255,255,0.1) 100%)`
                      } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Volume display */}
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(track.volume * 100)}%
                </div>
              </div>
            );
          })}

          {/* SEPARATOR */}
          <div style={{ background: 'var(--border)', width: '100%', height: '100%' }} />

          {/* MASTER BUS CHANNEL */}
          <div 
            style={{
              border: '1px solid var(--color-master)',
              boxShadow: '0 0 10px var(--color-master-glow)',
              background: 'rgba(251, 191, 36, 0.02)',
              borderRadius: '10px',
              padding: '16px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Header label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
              <span style={{ color: 'var(--color-master)' }}><Volume2 size={16} /></span>
              <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                MASTER
              </span>
            </div>

            {/* Dummy knob for balancing spacer */}
            <div style={{ height: '56px', display: 'flex', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ST OUT
            </div>

            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-master)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '4px', padding: '2px 6px', background: 'rgba(251, 191, 36, 0.05)', textTransform: 'uppercase' }}>
              LIMITER ON
            </div>

            {/* Level Meter and Volume Fader row */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', height: '190px', marginTop: '4px' }}>
              {/* VU Level Meter */}
              <div className="level-meter-bg">
                <div 
                  className="level-meter-fill"
                  style={{ 
                    height: `${peakLevels.master * 100}%`,
                  }}
                />
              </div>

              {/* Volume Slider (vertical wrapper) */}
              <div className="vertical-fader">
                <input 
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.01"
                  value={master.volume}
                  onChange={(e) => updateMasterVolume(parseFloat(e.target.value))}
                  className="fader-input"
                  style={{ 
                    '--track-color': 'var(--color-master)',
                    background: `linear-gradient(to right, var(--color-master) 0%, var(--color-master) ${master.volume * 83}%, rgba(255,255,255,0.1) ${master.volume * 83}%, rgba(255,255,255,0.1) 100%)`
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Volume display */}
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(master.volume * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
