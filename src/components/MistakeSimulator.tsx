import React from 'react';
import type { MistakeState } from '../hooks/useAudioEngine';
import { ShieldAlert, Info, Sparkles, RefreshCw } from 'lucide-react';

interface MistakeSimulatorProps {
  mistakes: MistakeState;
  toggleMistake: (name: keyof MistakeState) => void;
  clearAllMistakes: () => void;
  isPlaying: boolean;
}

export const MistakeSimulator: React.FC<MistakeSimulatorProps> = ({
  mistakes,
  toggleMistake,
  clearAllMistakes,
  isPlaying,
}) => {
  const activeMistakesCount = Object.values(mistakes).filter(Boolean).length;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={22} style={{ color: activeMistakesCount > 0 ? '#ef4444' : '#10b981' }} />
            DAW Mistake Simulator
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Toggle these common audio mistakes on/off to train your ears. Listen closely to what breaks in the mix!
          </p>
        </div>

        {activeMistakesCount > 0 && (
          <button className="btn btn-danger" onClick={clearAllMistakes} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            RESET TO CLEAN MIX
          </button>
        )}
      </div>

      {!isPlaying && (
        <div style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#fbbf24', display: 'flex', gap: '10px' }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <p>
            <strong>Ear-Training Hint:</strong> Press **PLAY MIX** on the mixer console above first, then toggle these mistakes. It is much easier to identify them while the music is playing!
          </p>
        </div>
      )}

      {/* Grid of Mistakes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* 1. MUDDINESS */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.muddyLowEnd ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)', 
            background: mistakes.muddyLowEnd ? 'rgba(245, 158, 11, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>1. The Muddy Low-End (250Hz Buildup)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.muddyLowEnd}
                onChange={() => toggleMistake('muddyLowEnd')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            When multiple instruments play in the 150Hz - 400Hz frequency zone (e.g., bass guitar, acoustic guitar, low snare body), their frequencies pile up and create a boomy, muddy "clog" that masks the rest of the mix.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#fb923c' }}>
            <strong>How to Fix:</strong> Use a high-pass filter (HPF) on all non-bass elements (guitars, vocals) around 80Hz - 120Hz to clean out unnecessary low-end rumble and let the bass guitar breathe.
          </div>
        </div>

        {/* 2. OVER-COMPRESSION */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.sausageMaster ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)', 
            background: mistakes.sausageMaster ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>2. The Sausage Master (Over-Limiting)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.sausageMaster}
                onChange={() => toggleMistake('sausageMaster')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            Cranking the master limiter to make the song "loud" crushes all the dynamics. Transients (like the sharp snap of the drums) disappear, and the song sounds squashed, fatiguing, and lifeless. Note how the Waveform Visualizer turns flat!
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#f87171' }}>
            <strong>How to Fix:</strong> Target a moderate loudness (e.g. -14 LUFS for streaming). Aim for no more than 2dB to 4dB of gain reduction on the limiter during the loudest parts of the song.
          </div>
        </div>

        {/* 3. WASHED OUT REVERB */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.washedReverb ? 'rgba(168, 85, 247, 0.4)' : 'var(--border)', 
            background: mistakes.washedReverb ? 'rgba(168, 85, 247, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>3. Washed-Out Reverb (Lost in Space)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.washedReverb}
                onChange={() => toggleMistake('washedReverb')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            Adding too much Reverb directly to channel strips drowns the dry signals. The vocals and guitars recede to the back of the mix, sounding like they are playing at the end of a long, dark corridor.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#c084fc' }}>
            <strong>How to Fix:</strong> Set up reverb on an AUX/Send track (100% wet) and route a small portion of the channel signals to it. Use a high-pass filter on the reverb return to prevent low-end mud.
          </div>
        </div>

        {/* 4. HARSH SIBILANCE */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.harshHighs ? 'rgba(0, 242, 254, 0.4)' : 'var(--border)', 
            background: mistakes.harshHighs ? 'rgba(0, 242, 254, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>4. Harsh / Piercing Sibilance (4k-8kHz)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.harshHighs}
                onChange={() => toggleMistake('harshHighs')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            Boosting high frequencies excessively to make a vocal sound "airy" makes sibilant consonant sounds (like S, T, and CH) piercing and painful to the ear. It sounds like needles in the speakers.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#22d3ee' }}>
            <strong>How to Fix:</strong> Use a **De-esser** (a frequency-specific compressor that only compresses the 5kHz - 8kHz region when an 'S' sound triggers it) or use dynamic EQ to selectively notch sibilant frequencies.
          </div>
        </div>

        {/* 5. PHASE CANCELLATION */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.phaseCancellation ? 'rgba(52, 211, 153, 0.4)' : 'var(--border)', 
            background: mistakes.phaseCancellation ? 'rgba(52, 211, 153, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>5. Phase Cancellation (Hollow Mono)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.phaseCancellation}
                onChange={() => toggleMistake('phaseCancellation')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            If two identical audio signals are 180 degrees out of phase, they cancel each other out completely when mixed. This happens here: we pan the guitar center and invert the phase of its right channel. Notice how the guitar sound completely thins out or vanishes!
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#34d399' }}>
            <strong>How to Fix:</strong> Ensure your stereo wideners or double-tracked parts are not exact copies. Use slightly different performances, EQ, or delays on the L and R channels.
          </div>
        </div>

        {/* 6. BOXY MIDRANGE */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.boxyMidrange ? 'rgba(192, 132, 252, 0.4)' : 'var(--border)', 
            background: mistakes.boxyMidrange ? 'rgba(192, 132, 252, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>6. Boxy Midrange (500Hz - 800Hz Buildup)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.boxyMidrange}
                onChange={() => toggleMistake('boxyMidrange')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            A build-up of energy in the 500Hz - 800Hz region makes tracks sound "hollow" or like they are playing inside a cheap cardboard box. This is typical of low-quality recording spaces or vocal booths.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#c084fc' }}>
            <strong>How to Fix:</strong> Apply a narrow parametric EQ cut (subtractive EQ) around 400Hz - 700Hz to clean out the boxy resonance, especially on vocals, snare drums, or acoustic guitars.
          </div>
        </div>

        {/* 7. CHOKED DRUMS */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.chokedDrums ? 'rgba(248, 113, 113, 0.4)' : 'var(--border)', 
            background: mistakes.chokedDrums ? 'rgba(248, 113, 113, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>7. Choked Drums (Ultra-Fast Compressor Attack)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.chokedDrums}
                onChange={() => toggleMistake('chokedDrums')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            Setting a compressor's attack time too fast (e.g. 1ms) clamps down immediately on drum hits. This completely destroys the "snap" or "pop" of the drum stick (transient), leaving the drums sounding weak, flat, and choked.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#f87171' }}>
            <strong>How to Fix:</strong> Use a slower compressor attack (30ms - 50ms) to let the initial transient peak pass through uncompressed before the gain reduction activates, keeping the drums punchy.
          </div>
        </div>

        {/* 8. DULL MASTER */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.dullMaster ? 'rgba(251, 191, 36, 0.4)' : 'var(--border)', 
            background: mistakes.dullMaster ? 'rgba(251, 191, 36, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>8. Dull Master (Missing Treble & Air)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.dullMaster}
                onChange={() => toggleMistake('dullMaster')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            A mix that lacks high-frequency energy (10kHz - 20kHz) sounds dark, dull, and distant, as if playing behind a heavy curtain. Air and treble are essential for modern mixes to sound professional and wide.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#fbbf24' }}>
            <strong>How to Fix:</strong> Apply a gentle High-Shelf boost (+1dB to +3dB) on the vocals, cymbals, or master bus. Avoid overdoing it, which leads to harshness or ear fatigue.
          </div>
        </div>

        {/* 9. EXCESSIVE STEREO WIDENING */}
        <div 
          className="glass-card" 
          style={{ 
            borderColor: mistakes.excessiveStereoWidening ? 'rgba(34, 211, 238, 0.4)' : 'var(--border)', 
            background: mistakes.excessiveStereoWidening ? 'rgba(34, 211, 238, 0.03)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#fff' }}>9. Excessive Haas Widening (Mono Clashing)</h3>
            <label className="switch-label">
              <input 
                type="checkbox" 
                className="switch-input"
                checked={mistakes.excessiveStereoWidening}
                onChange={() => toggleMistake('excessiveStereoWidening')}
              />
              <span className="switch-custom"></span>
              INJECT
            </label>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
            Delaying one channel of a stereo signal by 10-30ms (Haas Effect) makes it sound extremely wide. However, when summed to mono (like on phone speakers or club systems), it creates heavy phase cancellation, and the sound disappears.
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: '#22d3ee' }}>
            <strong>How to Fix:</strong> Always test your mix in mono. Avoid using delay-based stereo wideners on critical mono-centric tracks like vocals, kick drums, or bass lines.
          </div>
        </div>

      </div>

      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Sparkles size={20} style={{ color: 'var(--color-master)' }} />
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          <strong>Pro Mixing Tip:</strong> A great mix sounds balanced in both stereo speakers and mono (like a phone speaker). Checking your mix in **Mono** is the best way to catch phase cancellation and low-end muddiness early!
        </p>
      </div>
      
    </div>
  );
};
