import React, { useState } from 'react';
import type { TrackId } from '../hooks/useAudioEngine';
import { BookOpen, Award, ArrowRight, CheckCircle2, Play, Volume2, Mic, Music, Compass } from 'lucide-react';

interface LessonSectionProps {
  loadPreset: (presetName: 'unmixed' | 'vocal_mix' | 'guitar_mix' | 'master_mix') => void;
  setSelectedTrackId: (id: TrackId) => void;
  isPlaying: boolean;
  togglePlay: () => void;
}

interface LessonContent {
  id: string;
  title: string;
  category: string;
  duration: string;
  icon: React.ReactNode;
  summary: string;
}

export const LessonSection: React.FC<LessonSectionProps> = ({
  loadPreset,
  setSelectedTrackId,
  isPlaying,
  togglePlay
}) => {
  const [activeLessonId, setActiveLessonId] = useState<string>('vocal_rec');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const lessons: LessonContent[] = [
    {
      id: 'vocal_rec',
      title: 'Vocal Recording & Gain Staging',
      category: 'RECORDING',
      duration: '4 mins',
      icon: <Mic size={16} />,
      summary: 'Learn microphonic proximity effects, acoustics, headroom, and how to capture a clean source.'
    },
    {
      id: 'vocal_mix',
      title: 'Vocal Mixing (EQ & Compression)',
      category: 'MIXING',
      duration: '5 mins',
      icon: <BookOpen size={16} />,
      summary: 'Learn subtractive EQ, vocal compression, de-essing, and placing vocals in a spatial reverb.'
    },
    {
      id: 'guitar_mix',
      title: 'Guitars & Stereo Width',
      category: 'MIXING',
      duration: '5 mins',
      icon: <Music size={16} />,
      summary: 'Learn panning double-tracked guitars, high-pass filtering, and carving midrange pockets.'
    },
    {
      id: 'mastering',
      title: 'Mastering Basics & Loudness',
      category: 'MASTERING',
      duration: '4 mins',
      icon: <Compass size={16} />,
      summary: 'Learn final polish, loudness standards (LUFS), and how to set a brickwall limiter.'
    }
  ];

  const handleCompleteLesson = (id: string) => {
    if (!completedLessons.includes(id)) {
      setCompletedLessons([...completedLessons, id]);
    }
  };

  const handleQuizAnswer = (lessonId: string, questionIndex: number, optionIndex: number) => {
    const key = `${lessonId}_${questionIndex}`;
    setQuizAnswers(prev => ({ ...prev, [key]: optionIndex }));
    setShowFeedback(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'stretch' }}>
      
      {/* SIDEBAR: LESSON LIST */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, padding: '0 8px 10px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} style={{ color: 'var(--accent-cyan)' }} />
          ACADEMY LESSONS
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {lessons.map(lesson => {
            const isActive = activeLessonId === lesson.id;
            const isCompleted = completedLessons.includes(lesson.id);
            return (
              <div
                key={lesson.id}
                onClick={() => {
                  setActiveLessonId(lesson.id);
                  // Auto-select relevant track in console
                  if (lesson.id === 'vocal_mix') setSelectedTrackId('vocals');
                  if (lesson.id === 'guitar_mix') setSelectedTrackId('guitar');
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-cyan)' : 'transparent',
                  background: isActive ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                    {lesson.icon}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {lesson.category} • {lesson.duration}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                      {lesson.title}
                    </span>
                  </div>
                </div>
                {isCompleted && (
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
          <Award size={20} style={{ color: '#fbbf24', margin: '0 auto 6px auto' }} />
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 600 }}>PROGRESS</span>
          <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            {completedLessons.length} / {lessons.length} COMPLETED
          </span>
        </div>
      </div>

      {/* MAIN LESSON CONTAINER */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* LESSON 1: VOCAL RECORDING */}
        {activeLessonId === 'vocal_rec' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(0,242,254,0.08)', padding: '2px 8px', borderRadius: '4px' }}>RECORDING MODULE</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginTop: '6px', color: '#fff' }}>Vocal Recording & Gain Staging</h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Great mixes start with high-quality recordings. If a vocal sounds muddy, noisy, or distorted at the recording stage, no amount of EQ or compression can completely save it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mic size={14} style={{ color: 'var(--color-vocals)' }} />
                  1. The Proximity Effect
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Most vocal microphones have a cardioid pattern. When a singer gets extremely close to the microphone (less than 3 inches), the microphone naturally boosts low-end frequencies. This is called the <strong>Proximity Effect</strong>.
                  <br /><br />
                  While this adds "bass" and intimacy, it often makes the recording boomy and muddy. 
                  <strong style={{ color: '#fff', display: 'block', marginTop: '6px' }}>Rule of thumb: Maintain a distance of 6-8 inches (about one open hand-span) from the mic, using a pop filter.</strong>
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} style={{ color: 'var(--color-master)' }} />
                  2. Headroom & Gain Staging
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Unlike analog equipment, digital audio has a hard limit at **0 dBFS** (Decibels Full Scale). If your incoming signal crosses 0 dBFS, the tops of the waveforms are flattened off, producing harsh, unpleasantly distorted **digital clipping**.
                  <br /><br />
                  <strong>Gain Staging</strong> means recording at conservative levels to leave safety margin (**headroom**).
                  <strong style={{ color: '#fff', display: 'block', marginTop: '6px' }}>Target: Set input levels so your peaks sit between -18dB and -12dB in your DAW, leaving plenty of headroom for mixing plugins.</strong>
                </p>
              </div>
            </div>

            {/* Quiz Section */}
            <div style={{ background: '#0a0d17', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Quick Quiz: Headroom
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                What is the recommended peak target level when recording digital vocals into a DAW?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['Directly at 0 dB to maximize volume', 'Peaking between -18dB and -12dB to leave headroom', 'As quiet as possible, around -60dB'].map((option, idx) => {
                  const isSelected = quizAnswers['vocal_rec_0'] === idx;
                  const isCorrect = idx === 1;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer('vocal_rec', 0, idx)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : 'var(--border)',
                        background: isSelected ? (isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(0,0,0,0.2)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        textAlign: 'left',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              
              {showFeedback['vocal_rec_0'] && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: quizAnswers['vocal_rec_0'] === 1 ? '#34d399' : '#f87171' }}>
                  {quizAnswers['vocal_rec_0'] === 1 
                    ? 'Correct! Peaking between -18dB and -12dB ensures you do not clip and leaves enough room for EQs, compressors, and saturators to work.'
                    : 'Incorrect. Try again! Recording too hot causes clipping, while recording too low approaches the noise floor.'}
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleCompleteLesson('vocal_rec')}
              style={{ alignSelf: 'flex-end', marginTop: '10px' }}
            >
              Mark Lesson Complete <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* LESSON 2: VOCAL MIXING */}
        {activeLessonId === 'vocal_mix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-vocals)', background: 'var(--color-vocals-glow)', padding: '2px 8px', borderRadius: '4px' }}>MIXING MODULE</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginTop: '6px', color: '#fff' }}>Vocal Mixing Chain (EQ, Compressor & Space)</h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Vocals are the focal point of almost every song. Mixing them is a fine art of balancing frequencies, smoothing out volume dynamics, and placing them in a realistic space.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>The Standard Vocal Processing Chain</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                <li>
                  <strong style={{ color: 'var(--color-vocals)' }}>Subtractive EQ:</strong> High-pass filter (HPF) below 100Hz to remove microphone stand rumble. Apply a gentle cut around 200Hz - 400Hz if the voice sounds muddy or congested.
                </li>
                <li>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Compression:</strong> Smooths out vocal dynamics so quiet words can be heard, and loud shouts don't pierce the speakers. Use a gentle ratio (2:1 to 4:1) with a fast release to keep the performance natural.
                </li>
                <li>
                  <strong style={{ color: 'var(--color-master)' }}>Additive EQ:</strong> Boost a high shelf above 10kHz by +2dB or +3dB to add high-end "air" and presence, helping the voice sit on top of heavy instrument mixes.
                </li>
                <li>
                  <strong style={{ color: 'var(--color-vocals)' }}>Space (Reverb & Delay):</strong> Route the vocal to a reverb send. A short plate reverb adds space, and a dotted 8th note delay adds width without muddying up the dry vocal.
                </li>
              </ul>
            </div>

            {/* Interactive Exercise */}
            <div style={{ background: '#0a0d17', border: '1px dashed var(--color-vocals)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={14} style={{ color: 'var(--color-vocals)' }} />
                Interactive Hands-on Challenge: Vocal Enhancement
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Let's load the **"Unmixed Raw Mix"** preset. Listen to the vocals: they are dull, uncompressed, dry, and compete with the boomy acoustic guitar. Then click **"Apply Vocal Mix Chain"** to hear the instant difference!
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => loadPreset('unmixed')}>
                  1. Load Unmixed Presets
                </button>
                <button className="btn btn-accent" onClick={() => {
                  loadPreset('vocal_mix');
                  // Trigger play if not playing
                  if (!isPlaying) togglePlay();
                }}>
                  2. Apply Vocal Mix Chain
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                *Note: Watch how the EQ graph and Compressor settings for "Lead Vocals" jump to optimal parameters when you apply the chain!*
              </p>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleCompleteLesson('vocal_mix')}
              style={{ alignSelf: 'flex-end', marginTop: '10px' }}
            >
              Mark Lesson Complete <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* LESSON 3: GUITARS & WIDTH */}
        {activeLessonId === 'guitar_mix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-guitar)', background: 'var(--color-guitar-glow)', padding: '2px 8px', borderRadius: '4px' }}>MIXING MODULE</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginTop: '6px', color: '#fff' }}>Mixing Guitars & Creating Stereo Width</h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Instruments like acoustic and electric guitars contain a massive amount of midrange frequency energy. If you leave them panned center, they block the lead vocals. 
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: '#fff', marginBottom: '8px' }}>
                  1. Double Tracking & Panning
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  If you pan your vocals center, you should pan your rhythm guitars out of the way. 
                  <br /><br />
                  A common studio technique is <strong>Double Tracking</strong>: recording two separate performances of the same guitar riff, and panning one hard Left (e.g. L80) and the other hard Right (R80).
                  This creates massive stereo width and leaves a clean "pocket" in the center for the lead vocals and bass.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: '#fff', marginBottom: '8px' }}>
                  2. High-Pass Cleaning
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Acoustic guitars have a resonant body that produces frequencies down to 80Hz. However, the bass guitar and kick drum own this region.
                  <br /><br />
                  To prevent boominess and clashing, we apply a <strong>High-Pass Filter (HPF)</strong> on guitars, rolling off frequencies below 100Hz - 120Hz. The guitars will sound thinner in solo, but in the full mix, the entire low-end suddenly becomes tight and distinct.
                </p>
              </div>
            </div>

            {/* Interactive Exercise */}
            <div style={{ background: '#0a0d17', border: '1px dashed var(--color-guitar)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={14} style={{ color: 'var(--color-guitar)' }} />
                Interactive Hands-on Challenge: Opening the Stereo Pocket
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Let's load the unmixed preset (with mono center-panned guitars and muddy bass). Then click **"Apply Guitar Mix settings"**: the guitars will be panned Left, high-passed at 110Hz, and the vocal pocket will immediately clear up!
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => loadPreset('unmixed')}>
                  1. Load Unmixed Presets
                </button>
                <button className="btn btn-accent" onClick={() => {
                  loadPreset('guitar_mix');
                  if (!isPlaying) togglePlay();
                }}>
                  2. Pan & Filter Guitars
                </button>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleCompleteLesson('guitar_mix')}
              style={{ alignSelf: 'flex-end', marginTop: '10px' }}
            >
              Mark Lesson Complete <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* LESSON 4: MASTERING */}
        {activeLessonId === 'mastering' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-master)', background: 'var(--color-master-glow)', padding: '2px 8px', borderRadius: '4px' }}>MASTERING MODULE</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginTop: '6px', color: '#fff' }}>Mastering Basics & Loudness Control</h2>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Mastering is the final step in the audio pipeline. It involves balancing the overall frequency spectrum, optimizing stereo image, and maximizing the volume using a brickwall limiter.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>Key Mastering Elements</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                <li>
                  <strong>Loudness Targets (LUFS):</strong> LUFS stands for Loudness Units Full Scale. Unlike peak dB, LUFS measures perceived loudness. Streaming platforms like Spotify normalize audio to **-14 LUFS**. Pushing a limiter too hard past this creates dynamic distortion.
                </li>
                <li>
                  <strong>The Brickwall Limiter:</strong> A limiter is an extreme compressor (ratio of 20:1 or infinity:1). We set a "ceiling" (e.g. -1.0 dBFS) to prevent digital clipping, and drag down the threshold to bring up the quiet parts of the song.
                </li>
                <li>
                  <strong>Dynamic Preservation:</strong> A common mistake is compressing too much, flattening the transients (snare clicks), and leaving a "sausage" waveform that sounds dull and fatiguing.
                </li>
              </ul>
            </div>

            {/* Quiz Section */}
            <div style={{ background: '#0a0d17', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginTop: '4px' }}>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Quick Quiz: Loudness
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                What does a brickwall limiter do on the master bus?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  'It adds echo and reverb to the song',
                  'It prevents the signal from clipping past 0dB and boosts average volume',
                  'It separates the vocals from the music'
                ].map((option, idx) => {
                  const isSelected = quizAnswers['master_0'] === idx;
                  const isCorrect = idx === 1;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer('mastering', 0, idx)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : 'var(--border)',
                        background: isSelected ? (isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(0,0,0,0.2)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        textAlign: 'left',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              
              {showFeedback['master_0'] && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: quizAnswers['master_0'] === 1 ? '#34d399' : '#f87171' }}>
                  {quizAnswers['master_0'] === 1 
                    ? 'Correct! Limiters act as strict guards preventing digital clipping while letting us push up the average signal level.'
                    : 'Incorrect. Try again! Limiters do not add echo, nor do they separate audio channels.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
              <button className="btn btn-accent" onClick={() => {
                loadPreset('master_mix');
                if (!isPlaying) togglePlay();
              }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={14} /> Load Fully Mastered Mix
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={() => handleCompleteLesson('mastering')}
                style={{ marginLeft: 'auto' }}
              >
                Mark Lesson Complete <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
