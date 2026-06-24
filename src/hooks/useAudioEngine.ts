import { useEffect, useRef, useState } from 'react';

export type TrackId = 'vocals' | 'guitar' | 'drums' | 'bass';

export interface EQState {
  highPass: number; // Hz, 20 to 800
  lowShelf: number; // Gain, -12 to +12
  midFreq: number;  // Hz, 500 to 4000
  midGain: number;  // Gain, -12 to +12
  highShelf: number;// Gain, -12 to +12
}

export interface CompressorState {
  threshold: number; // dB, -40 to 0
  ratio: number;     // 1 to 20
  attack: number;    // seconds, 0.005 to 0.2
  release: number;   // seconds, 0.05 to 1.0
  bypass: boolean;
}

export interface TrackState {
  id: TrackId;
  name: string;
  volume: number;      // 0 to 1.2
  pan: number;         // -1 to 1
  mute: boolean;
  solo: boolean;
  reverbSend: number;  // 0 to 1
  delaySend: number;   // 0 to 1
  eq: EQState;
  compressor: CompressorState;
}

export interface MasterState {
  volume: number;      // 0 to 1.2
  limiterThreshold: number; // dB, -20 to 0
}

export interface MistakeState {
  muddyLowEnd: boolean;
  sausageMaster: boolean;
  washedReverb: boolean;
  harshHighs: boolean;
  phaseCancellation: boolean;
  boxyMidrange: boolean;
  chokedDrums: boolean;
  dullMaster: boolean;
  excessiveStereoWidening: boolean;
}

// Initial defaults
const initialTrackState = (id: TrackId, name: string): TrackState => ({
  id,
  name,
  volume: 0.8,
  pan: id === 'guitar' ? -0.2 : id === 'vocals' ? 0 : id === 'drums' ? 0.1 : -0.1,
  mute: false,
  solo: false,
  reverbSend: id === 'vocals' ? 0.25 : id === 'guitar' ? 0.15 : 0.05,
  delaySend: id === 'vocals' ? 0.15 : 0,
  eq: {
    highPass: 20, // bypass
    lowShelf: 0,
    midFreq: 1500,
    midGain: 0,
    highShelf: 0,
  },
  compressor: {
    threshold: 0, // bypass
    ratio: 2,
    attack: 0.03, // 30ms
    release: 0.15, // 150ms
    bypass: false,
  },
});

export const useAudioEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Tracks state
  const [tracks, setTracks] = useState<Record<TrackId, TrackState>>({
    vocals: initialTrackState('vocals', 'Lead Vocals'),
    guitar: initialTrackState('guitar', 'Acoustic Guitar'),
    drums: initialTrackState('drums', 'Drums (Groove)'),
    bass: initialTrackState('bass', 'Bass Guitar'),
  });

  // Master bus state
  const [master, setMaster] = useState<MasterState>({
    volume: 0.8,
    limiterThreshold: -1.0,
  });

  // Genre selection state
  const [genre, setGenre] = useState<'pop' | 'synthwave' | 'rock'>('pop');

  // Mistake Simulator State
  const [mistakes, setMistakes] = useState<MistakeState>({
    muddyLowEnd: false,
    sausageMaster: false,
    washedReverb: false,
    harshHighs: false,
    phaseCancellation: false,
    boxyMidrange: false,
    chokedDrums: false,
    dullMaster: false,
    excessiveStereoWidening: false,
  });

  // Selected Track for detailed editing
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>('vocals');

  // Web Audio Node references
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Global nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const masterLowPassRef = useRef<BiquadFilterNode | null>(null);
  const haasDelayRef = useRef<DelayNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  
  // Track-specific nodes
  const trackNodesRef = useRef<Record<TrackId, {
    sourceGain: GainNode;
    highPass: BiquadFilterNode;
    lowShelf: BiquadFilterNode;
    midPeak: BiquadFilterNode;
    highShelf: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
    panner: StereoPannerNode;
    faderGain: GainNode;
    reverbSend: GainNode;
    delaySend: GainNode;
    analyser: AnalyserNode;
    // Phase Cancellation nodes
    splitter?: ChannelSplitterNode;
    phaseGain?: GainNode;
    normalGain?: GainNode;
    merger?: ChannelMergerNode;
  }> | null>(null);

  // Clock / Sequencer refs
  const sequencerTimerIdRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0.0);
  const currentStepRef = useRef<number>(0); // 0 to 63 (4 bars of 16 steps)
  const scheduleAheadTime = 0.1; // schedule 100ms ahead
  const lookaheadInterval = 40.0; // poll every 40ms

  // Track Peak Volume levels (for VU meters)
  const [peakLevels, setPeakLevels] = useState<Record<TrackId | 'master', number>>({
    vocals: 0,
    guitar: 0,
    drums: 0,
    bass: 0,
    master: 0,
  });

  // Initialize Audio Context and build DSP graph
  const initAudio = () => {
    if (audioCtxRef.current) return;

    // Create Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Create Master chain
    const masterGain = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    const masterLowPass = ctx.createBiquadFilter();
    const haasDelay = ctx.createDelay(0.1);
    const masterSplitter = ctx.createChannelSplitter(2);
    const masterMerger = ctx.createChannelMerger(2);
    const analyser = ctx.createAnalyser();
    
    // Configure Limiter as a brickwall protection
    limiter.threshold.setValueAtTime(-1.0, ctx.currentTime);
    limiter.knee.setValueAtTime(0.0, ctx.currentTime);
    limiter.ratio.setValueAtTime(20.0, ctx.currentTime);
    limiter.attack.setValueAtTime(0.001, ctx.currentTime);
    limiter.release.setValueAtTime(0.05, ctx.currentTime);

    // Configure master Lowpass (bypass by default)
    masterLowPass.type = 'lowpass';
    masterLowPass.frequency.setValueAtTime(20000, ctx.currentTime);

    // Configure Haas Delay (bypass / 0ms by default)
    haasDelay.delayTime.setValueAtTime(0.0, ctx.currentTime);

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;

    // Connect Master chain
    limiter.connect(masterLowPass);
    masterLowPass.connect(masterGain);
    
    masterGain.connect(masterSplitter);
    // Connect Left directly
    masterSplitter.connect(masterMerger, 0, 0);
    // Connect Right through haasDelay
    masterSplitter.connect(haasDelay, 1, 0);
    haasDelay.connect(masterMerger, 0, 1);
    
    masterMerger.connect(analyser);
    analyser.connect(ctx.destination);

    masterGainRef.current = masterGain;
    limiterRef.current = limiter;
    masterLowPassRef.current = masterLowPass;
    haasDelayRef.current = haasDelay;
    analyserRef.current = analyser;

    // Create Sends: Reverb
    const reverb = ctx.createConvolver();
    reverb.buffer = createReverbImpulseResponse(ctx, 2.2, 2.0); // 2.2s room reverb
    reverb.connect(limiter);
    reverbRef.current = reverb;

    // Create Sends: Delay
    const delay = ctx.createDelay(1.0);
    const delayFeedback = ctx.createGain();
    delay.delayTime.setValueAtTime(0.375, ctx.currentTime); // dotted 8th at 120bpm (60/120 * 0.75)
    delayFeedback.gain.setValueAtTime(0.35, ctx.currentTime); // feedback volume
    
    delay.connect(delayFeedback);
    delayFeedback.connect(delay); // feedback loop
    delay.connect(limiter); // delay output to master

    delayRef.current = delay;
    delayFeedbackRef.current = delayFeedback;

    // Create Track Processing Nodes
    const trackList: TrackId[] = ['vocals', 'guitar', 'drums', 'bass'];
    const trackNodes: any = {};

    trackList.forEach(id => {
      const sourceGain = ctx.createGain(); // node that receives synth output
      
      // EQ chain
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 20;

      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 80;
      lowShelf.gain.value = 0;

      const midPeak = ctx.createBiquadFilter();
      midPeak.type = 'peaking';
      midPeak.frequency.value = 1500;
      midPeak.Q.value = 1.0;
      midPeak.gain.value = 0;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 10000;
      highShelf.gain.value = 0;

      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = 0; // bypass by default
      compressor.ratio.value = 2;
      compressor.attack.value = 0.03;
      compressor.release.value = 0.15;

      // Pan & Fader Gain
      const panner = ctx.createStereoPanner();
      const faderGain = ctx.createGain();
      
      // Sends
      const reverbSend = ctx.createGain();
      const delaySend = ctx.createGain();

      // Individual Track Analyser (for VU meters)
      const trackAnalyser = ctx.createAnalyser();
      trackAnalyser.fftSize = 64;

      // Connect standard chain
      sourceGain.connect(highPass);
      highPass.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(compressor);
      
      // Setup phase cancellation node network for guitar
      let splitter: ChannelSplitterNode | undefined;
      let phaseGain: GainNode | undefined;
      let normalGain: GainNode | undefined;
      let merger: ChannelMergerNode | undefined;

      if (id === 'guitar') {
        splitter = ctx.createChannelSplitter(2);
        normalGain = ctx.createGain(); // Left channel path
        phaseGain = ctx.createGain();  // Right channel path (phase reversible)
        merger = ctx.createChannelMerger(2);

        compressor.connect(splitter);
        
        // Connect Left directly
        splitter.connect(normalGain, 0, 0);
        normalGain.connect(merger, 0, 0);

        // Connect Right through phaseGain
        splitter.connect(phaseGain, 1, 0);
        phaseGain.connect(merger, 0, 1);

        phaseGain.gain.setValueAtTime(1.0, ctx.currentTime); // In-phase by default
        
        merger.connect(panner);
      } else {
        compressor.connect(panner);
      }

      panner.connect(faderGain);
      
      // Outputs
      faderGain.connect(limiter); // Direct to master limiter
      faderGain.connect(trackAnalyser);

      // Sends routing
      faderGain.connect(reverbSend);
      reverbSend.connect(reverb);

      faderGain.connect(delaySend);
      delaySend.connect(delay);

      trackNodes[id] = {
        sourceGain,
        highPass,
        lowShelf,
        midPeak,
        highShelf,
        compressor,
        panner,
        faderGain,
        reverbSend,
        delaySend,
        analyser: trackAnalyser,
        splitter,
        normalGain,
        phaseGain,
        merger
      };
    });

    trackNodesRef.current = trackNodes;
    setIsAudioReady(true);

    // Apply current UI states to the newly created audio nodes
    applyAllParameters();

    // Start VU meters update loop
    startVUMeters();
  };

  // Generate synthetic Reverb Room Response using white noise with exponential decay
  const createReverbImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const percent = i / length;
      const val = (Math.random() * 2 - 1) * Math.pow(1 - percent, decay);
      left[i] = val;
      // decorrelate stereo slightly for width
      right[i] = val * (i % 2 === 0 ? 1 : -0.85);
    }
    return impulse;
  };

  // Helper to apply all state parameters to Web Audio nodes
  const applyAllParameters = () => {
    if (!audioCtxRef.current || !trackNodesRef.current) return;
    const ctx = audioCtxRef.current;

    // Master settings
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(master.volume, ctx.currentTime);
    }
    if (limiterRef.current) {
      // If sausage master is active, we push the threshold extremely low and apply massive gain
      const isSausage = mistakes.sausageMaster;
      limiterRef.current.threshold.setValueAtTime(
        isSausage ? -36.0 : master.limiterThreshold, 
        ctx.currentTime
      );
      // Compensatory volume boost for sausage
      if (masterGainRef.current) {
        masterGainRef.current.gain.setValueAtTime(
          isSausage ? master.volume * 2.5 : master.volume, 
          ctx.currentTime
        );
      }
    }
    // Master LowPass for Dull Master mistake
    if (masterLowPassRef.current) {
      const lowPassFreq = mistakes.dullMaster ? 4500 : 20000;
      masterLowPassRef.current.frequency.setValueAtTime(lowPassFreq, ctx.currentTime);
    }
    // Haas Delay for Excessive Stereo Widening mistake
    if (haasDelayRef.current) {
      const delaySecs = mistakes.excessiveStereoWidening ? 0.025 : 0.0; // 25ms delay
      haasDelayRef.current.delayTime.setValueAtTime(delaySecs, ctx.currentTime);
    }

    // Track-specific settings
    (Object.keys(tracks) as TrackId[]).forEach(id => {
      const state = tracks[id];
      const nodes = trackNodesRef.current![id];

      // Volume fader
      // Solo / Mute logic
      const isAnySolo = Object.values(tracks).some(t => t.solo);
      let targetVolume = state.volume;
      if (state.mute) {
        targetVolume = 0;
      } else if (isAnySolo && !state.solo) {
        targetVolume = 0;
      }
      nodes.faderGain.gain.setValueAtTime(targetVolume, ctx.currentTime);

      // Panning
      nodes.panner.pan.setValueAtTime(state.pan, ctx.currentTime);

      // EQ
      // Check for Muddy Low-End mistake (boosts 250Hz on drums, guitar, bass)
      let lowShelfGain = state.eq.lowShelf;
      let midFreq = state.eq.midFreq;
      let midGain = state.eq.midGain;
      let highPassFreq = state.eq.highPass;
      let highShelfGain = state.eq.highShelf;

      if (mistakes.muddyLowEnd && (id === 'guitar' || id === 'drums' || id === 'bass')) {
        // Boost 250Hz by +10dB and disable high pass
        highPassFreq = 20; // reset high pass
        midFreq = 250;
        midGain = 10;
      }

      // Check for Harsh Highs mistake on Vocals
      if (mistakes.harshHighs && id === 'vocals') {
        highShelfGain = 10;
        midFreq = 6500;
        midGain = 8;
      }

      // Boxy midrange mistake boosts 600Hz on vocals and guitars
      if (mistakes.boxyMidrange && (id === 'vocals' || id === 'guitar')) {
        midFreq = 600;
        midGain = 8;
      }

      nodes.highPass.frequency.setValueAtTime(highPassFreq, ctx.currentTime);
      nodes.lowShelf.gain.setValueAtTime(lowShelfGain, ctx.currentTime);
      nodes.midPeak.frequency.setValueAtTime(midFreq, ctx.currentTime);
      nodes.midPeak.gain.setValueAtTime(midGain, ctx.currentTime);
      nodes.highShelf.gain.setValueAtTime(highShelfGain, ctx.currentTime);

      // Compressor
      // If sausage master mistake is on, crush all track compressors as well
      const isSausage = mistakes.sausageMaster;
      let compThresh = isSausage ? -35 : state.compressor.bypass ? 0 : state.compressor.threshold;
      let compRatio = isSausage ? 16 : state.compressor.bypass ? 1 : state.compressor.ratio;
      let compAttack = state.compressor.attack;
      let compRelease = state.compressor.release;

      if (id === 'drums' && mistakes.chokedDrums) {
        compThresh = -30;
        compRatio = 8;
        compAttack = 0.001; // 1ms (chokes transients)
        compRelease = 0.05; // 50ms
      }

      nodes.compressor.threshold.setValueAtTime(compThresh, ctx.currentTime);
      nodes.compressor.ratio.setValueAtTime(compRatio, ctx.currentTime);
      nodes.compressor.attack.setValueAtTime(compAttack, ctx.currentTime);
      nodes.compressor.release.setValueAtTime(compRelease, ctx.currentTime);

      // Sends
      // Washed reverb mistake cranks reverb sends
      const revSend = mistakes.washedReverb && (id === 'vocals' || id === 'guitar') ? 0.9 : state.reverbSend;
      nodes.reverbSend.gain.setValueAtTime(revSend, ctx.currentTime);
      nodes.delaySend.gain.setValueAtTime(state.delaySend, ctx.currentTime);

      // Phase Inversion on Guitar
      if (id === 'guitar' && nodes.phaseGain) {
        const phaseSign = mistakes.phaseCancellation ? -1.0 : 1.0;
        nodes.phaseGain.gain.setValueAtTime(phaseSign, ctx.currentTime);
      }
    });
  };

  // Sync state changes with nodes
  useEffect(() => {
    applyAllParameters();
  }, [tracks, master, mistakes, genre]);

  // VU Meters Peak calculation loop
  const startVUMeters = () => {
    const dataArray = new Uint8Array(32);
    
    const updatePeaks = () => {
      if (!isPlaying || !trackNodesRef.current || !analyserRef.current) {
        requestAnimationFrame(updatePeaks);
        return;
      }

      const newPeaks = { ...peakLevels };

      // Individual tracks
      (Object.keys(tracks) as TrackId[]).forEach(id => {
        const analyser = trackNodesRef.current![id].analyser;
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Map 0-255 to 0-1
        newPeaks[id] = Math.min(1.0, average / 140);
      });

      // Master output
      const masterAnalyser = analyserRef.current!;
      const masterData = new Uint8Array(128);
      masterAnalyser.getByteFrequencyData(masterData);
      let mSum = 0;
      for (let i = 0; i < masterData.length; i++) {
        mSum += masterData[i];
      }
      const mAverage = mSum / masterData.length;
      newPeaks['master'] = Math.min(1.0, mAverage / 150);

      setPeakLevels(newPeaks);
      requestAnimationFrame(updatePeaks);
    };

    requestAnimationFrame(updatePeaks);
  };

  // --- AUDIO SYNTHESIZERS AND SEQUENCER ---

  // Drum Synth sounds generator
  const triggerKick = (ctx: AudioContext, time: number, velocity: number = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(trackNodesRef.current!.drums.sourceGain);
    
    // Pitch sweep: 150Hz -> 45Hz
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    
    // Gain envelope: fast attack, quick decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 1.1, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const triggerSnare = (ctx: AudioContext, time: number, velocity: number = 1.0) => {
    // White noise buffer
    const bufferSize = ctx.sampleRate * 0.2; // 200ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, time);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(trackNodesRef.current!.drums.sourceGain);

    // Snare tone (triangle osc sweep)
    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    const toneGain = ctx.createGain();
    
    tone.frequency.setValueAtTime(180, time);
    tone.frequency.exponentialRampToValueAtTime(100, time + 0.08);
    
    toneGain.gain.setValueAtTime(0, time);
    toneGain.gain.linearRampToValueAtTime(velocity * 0.5, time + 0.005);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    tone.connect(toneGain);
    toneGain.connect(trackNodesRef.current!.drums.sourceGain);
    
    noise.start(time);
    tone.start(time);
    noise.stop(time + 0.2);
    tone.stop(time + 0.2);
  };

  const triggerHihat = (ctx: AudioContext, time: number, velocity: number = 1.0) => {
    // White noise burst
    const bufferSize = ctx.sampleRate * 0.05; // 50ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.25, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(trackNodesRef.current!.drums.sourceGain);
    
    noise.start(time);
    noise.stop(time + 0.06);
  };

  // Bass Synthesizer playing a deep triangle wave
  const triggerBassNote = (ctx: AudioContext, frequency: number, time: number, duration: number, velocity: number = 1.0) => {
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    subOsc.type = 'sine'; // deep sub

    // Lowpass filter for warm bass tone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);

    osc.frequency.setValueAtTime(frequency, time);
    subOsc.frequency.setValueAtTime(frequency / 2, time); // sub octave

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.55, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(trackNodesRef.current!.bass.sourceGain);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + duration);
    subOsc.stop(time + duration);
  };

  // Guitar Synthesizer (Sawtooth arpeggios + Karplus-Strong string simulation effect)
  const triggerGuitarNote = (ctx: AudioContext, frequency: number, time: number, duration: number, velocity: number = 1.0) => {
    // Physical pluck style - quick delay feedback string model
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 2, time);
    filter.frequency.exponentialRampToValueAtTime(frequency, time + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.45, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Chorus / Double delay feel
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.015, time); // 15ms double
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.3, time);

    osc.connect(filter);
    filter.connect(gain);
    
    // Direct and delayed path for guitar stereo image
    gain.connect(trackNodesRef.current!.guitar.sourceGain);
    
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(trackNodesRef.current!.guitar.sourceGain);

    osc.start(time);
    osc.stop(time + duration);
  };

  // Vocal Synthesizer (using FM synthesis + Formant filtering to create vocal vowel texture)
  const triggerVocalNote = (ctx: AudioContext, frequency: number, time: number, duration: number, vowel: 'ah' | 'oh' | 'ee' = 'ah') => {
    // Carrier and Modulator (FM) for voice harmonic richness
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();

    carrier.type = 'sawtooth';
    modulator.type = 'sine';

    carrier.frequency.setValueAtTime(frequency, time);
    modulator.frequency.setValueAtTime(frequency * 1.5, time); // voice ratio

    // Vibrato LFO (6Hz)
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 6.0; // 6Hz
    vibratoGain.gain.value = 4.0; // depth

    vibrato.connect(vibratoGain);
    vibratoGain.connect(carrier.frequency);

    // Formant filters in parallel (vowel simulation)
    // 'ah' formant: F1 = 800Hz, F2 = 1200Hz
    // 'oh' formant: F1 = 500Hz, F2 = 800Hz
    // 'ee' formant: F1 = 300Hz, F2 = 2300Hz
    let f1Freq = 800;
    let f2Freq = 1200;
    if (vowel === 'oh') {
      f1Freq = 500;
      f2Freq = 900;
    } else if (vowel === 'ee') {
      f1Freq = 290;
      f2Freq = 2100;
    }

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(f1Freq, time);
    f1.Q.setValueAtTime(6.0, time);

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(f2Freq, time);
    f2.Q.setValueAtTime(8.0, time);

    const vocalGain = ctx.createGain();
    vocalGain.gain.setValueAtTime(0, time);
    vocalGain.gain.linearRampToValueAtTime(0.4, time + 0.08); // soft vocal attack
    vocalGain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

    // Connect FM synthesis
    modGain.gain.setValueAtTime(frequency * 0.8, time); // FM index
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Connect to formants in parallel
    carrier.connect(f1);
    carrier.connect(f2);
    
    f1.connect(vocalGain);
    f2.connect(vocalGain);

    vocalGain.connect(trackNodesRef.current!.vocals.sourceGain);

    vibrato.start(time);
    modulator.start(time);
    carrier.start(time);

    vibrato.stop(time + duration);
    modulator.stop(time + duration);
    carrier.stop(time + duration);
  };

  // Sequencer scheduler logic
  const scheduler = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleNextStep(currentStepRef.current, nextNoteTimeRef.current);
      advanceStep();
    }
  };

  const advanceStep = () => {
    const currentBPM = genre === 'synthwave' ? 110 : genre === 'rock' ? 135 : 120;
    const secondsPerBeat = 60.0 / currentBPM;
    // 16th note steps
    const stepDuration = 0.25 * secondsPerBeat;
    nextNoteTimeRef.current += stepDuration;
    
    currentStepRef.current = (currentStepRef.current + 1) % 64; // loop 4 bars (64 steps)
  };

  // Schedule notes for each track at this sixteenth note step
  const scheduleNextStep = (step: number, time: number) => {
    if (!audioCtxRef.current || !trackNodesRef.current) return;
    const ctx = audioCtxRef.current;
    
    const currentBPM = genre === 'synthwave' ? 110 : genre === 'rock' ? 135 : 120;
    const bar = Math.floor(step / 16);
    const relativeStep = step % 16;
    const stepSecs = (60.0 / currentBPM) * 0.25;

    if (genre === 'pop') {
      // --- POP ARRANGEMENT ---
      // Drums: Standard 4-on-the-floor
      if (step % 4 === 0) triggerKick(ctx, time, 1.0);
      if (step % 8 === 4) triggerSnare(ctx, time, 0.9);
      if (step % 2 === 0) {
        const vol = step % 4 === 2 ? 0.35 : 0.15;
        triggerHihat(ctx, time, vol);
      }

      // Chord progression: Am -> F -> C -> G
      let bassRoot = 55.0; // A1
      let guitarFrequencies = [220.0, 261.63, 329.63]; // A3, C4, E4
      if (bar === 1) {
        bassRoot = 43.65; // F1
        guitarFrequencies = [174.61, 220.0, 261.63];
      } else if (bar === 2) {
        bassRoot = 65.41; // C2
        guitarFrequencies = [196.0, 261.63, 329.63];
      } else if (bar === 3) {
        bassRoot = 49.00; // G1
        guitarFrequencies = [196.0, 246.94, 293.66];
      }

      // Bass: standard syncopated 8th notes
      if (step % 4 === 0 || step % 8 === 2) {
        triggerBassNote(ctx, bassRoot, time, stepSecs * 1.8, 0.95);
      }

      // Guitar plucking
      const guitarPluckPattern = [0, 3, 6, 8, 11, 14];
      if (guitarPluckPattern.includes(relativeStep)) {
        const noteIndex = guitarPluckPattern.indexOf(relativeStep) % guitarFrequencies.length;
        triggerGuitarNote(ctx, guitarFrequencies[noteIndex], time, stepSecs * 2.8, 0.8);
      }

      // Vocal Pentatonic Melody
      const vocalNotes: Record<number, { freq: number; vowel: 'ah' | 'oh' | 'ee'; length: number }> = {
        0: { freq: 440.0, vowel: 'ah', length: 0.8 },
        4: { freq: 493.88, vowel: 'ee', length: 0.6 },
        8: { freq: 523.25, vowel: 'oh', length: 1.0 },
        14: { freq: 587.33, vowel: 'ah', length: 0.3 },
        16: { freq: 523.25, vowel: 'ee', length: 0.7 },
        20: { freq: 440.0, vowel: 'oh', length: 0.5 },
        24: { freq: 392.0, vowel: 'ah', length: 0.9 },
        30: { freq: 440.0, vowel: 'ee', length: 0.4 },
        32: { freq: 523.25, vowel: 'ah', length: 0.8 },
        36: { freq: 587.33, vowel: 'ee', length: 0.6 },
        40: { freq: 659.25, vowel: 'oh', length: 1.1 },
        46: { freq: 587.33, vowel: 'ah', length: 0.3 },
        48: { freq: 493.88, vowel: 'ee', length: 0.8 },
        52: { freq: 440.0, vowel: 'oh', length: 0.6 },
        56: { freq: 392.0, vowel: 'ah', length: 1.2 },
      };

      if (vocalNotes[step]) {
        const note = vocalNotes[step];
        triggerVocalNote(ctx, note.freq, time, note.length * stepSecs * 3.5, note.vowel);
      }

    } else if (genre === 'synthwave') {
      // --- SYNTHWAVE ARRANGEMENT ---
      // Drums: Snappy electronic groove
      if (step % 4 === 0) triggerKick(ctx, time, 1.1); // driving kick
      if (step % 8 === 4) triggerSnare(ctx, time, 0.9); // gated snare on backbeat
      // 16th-note hihats with groove accents
      const hatVol = relativeStep % 4 === 2 ? 0.3 : relativeStep % 2 === 0 ? 0.18 : 0.08;
      triggerHihat(ctx, time, hatVol);

      // Chords progression: Bm -> G -> A -> F#m
      let bassRoot = 61.74; // B1 (61.74Hz)
      let padFrequencies = [246.94, 293.66, 369.99]; // B3, D4, F#4
      if (bar === 1) {
        bassRoot = 49.00; // G1
        padFrequencies = [196.00, 246.94, 293.66];
      } else if (bar === 2) {
        bassRoot = 55.00; // A1
        padFrequencies = [220.00, 277.18, 329.63];
      } else if (bar === 3) {
        bassRoot = 46.25; // F#1
        padFrequencies = [185.00, 220.00, 277.18];
      }

      // Bass: Pumping 16th-note arpeggiator (Root, Octave, Root, Octave...)
      const octaveMultiplier = (step % 2 === 0) ? 1.0 : 2.0;
      triggerBassNote(ctx, bassRoot * octaveMultiplier, time, stepSecs * 0.9, 0.8);

      // Guitar (Synth Pad chords): Slow atmospheric sweeps
      if (relativeStep === 0 || relativeStep === 8) {
        // Trigger chord notes spread out slightly
        padFrequencies.forEach((freq, idx) => {
          triggerGuitarNote(ctx, freq, time + idx * 0.015, stepSecs * 6, 0.65);
        });
      }

      // Vocals (FM Synth lead): arpeggiated 80s synth hook
      const synthLeadMelody: Record<number, { freq: number; vowel: 'ah' | 'oh' | 'ee'; length: number }> = {
        0: { freq: 493.88, vowel: 'ee', length: 1.5 }, // B4
        4: { freq: 554.37, vowel: 'ee', length: 1.5 }, // C#5
        8: { freq: 587.33, vowel: 'ah', length: 1.5 }, // D5
        12: { freq: 698.46, vowel: 'oh', length: 1.5 }, // F#5
        16: { freq: 392.00, vowel: 'ee', length: 1.5 }, // G4
        20: { freq: 493.88, vowel: 'ee', length: 1.5 }, // B4
        24: { freq: 587.33, vowel: 'ah', length: 1.5 }, // D5
        28: { freq: 493.88, vowel: 'oh', length: 1.5 }, // B4
        32: { freq: 440.00, vowel: 'ee', length: 1.5 }, // A4
        36: { freq: 554.37, vowel: 'ee', length: 1.5 }, // C#5
        40: { freq: 659.25, vowel: 'ah', length: 1.5 }, // E5
        44: { freq: 554.37, vowel: 'oh', length: 1.5 }, // C#5
        48: { freq: 369.99, vowel: 'ee', length: 1.5 }, // F#4
        52: { freq: 440.00, vowel: 'ee', length: 1.5 }, // A4
        56: { freq: 554.37, vowel: 'ah', length: 3.0 }, // C#5
      };

      if (synthLeadMelody[step]) {
        const note = synthLeadMelody[step];
        triggerVocalNote(ctx, note.freq, time, note.length * stepSecs * 0.95, note.vowel);
      }

    } else if (genre === 'rock') {
      // --- ROCK / INDIE ARRANGEMENT ---
      // Drums: Driving rock beat
      const isKick = relativeStep === 0 || relativeStep === 6 || relativeStep === 8 || relativeStep === 14;
      if (isKick) triggerKick(ctx, time, 1.15);
      
      const isSnare = relativeStep === 4 || relativeStep === 12;
      const isGhostSnare = relativeStep === 7 || relativeStep === 15;
      if (isSnare) triggerSnare(ctx, time, 1.05);
      if (isGhostSnare) triggerSnare(ctx, time, 0.2);

      if (step % 2 === 0) {
        triggerHihat(ctx, time, 0.35);
      }

      // Chords progression: Em -> C -> G -> D
      let bassRoot = 41.20; // E1 (41.20Hz)
      let chordFrequencies = [164.81, 196.00, 246.94]; // E3, G3, B3
      if (bar === 1) {
        bassRoot = 32.70; // C1
        chordFrequencies = [130.81, 164.81, 196.00];
      } else if (bar === 2) {
        bassRoot = 49.00; // G1
        chordFrequencies = [196.00, 246.94, 293.66];
      } else if (bar === 3) {
        bassRoot = 36.71; // D1
        chordFrequencies = [146.83, 185.00, 220.00];
      }

      // Bass: Driving eighth-note chugs
      if (step % 2 === 0) {
        triggerBassNote(ctx, bassRoot, time, stepSecs * 1.9, 0.95);
      }

      // Guitar: Strumming distorted chords
      const rockGuitarPattern = [0, 2, 4, 8, 10, 12];
      if (rockGuitarPattern.includes(relativeStep)) {
        chordFrequencies.forEach((freq, idx) => {
          triggerGuitarNote(ctx, freq, time + idx * 0.012, stepSecs * 1.7, 0.85);
        });
      }

      // Vocals: Grittier E-minor melodies
      const rockVocalMelody: Record<number, { freq: number; vowel: 'ah' | 'oh' | 'ee'; length: number }> = {
        0: { freq: 392.00, vowel: 'ah', length: 0.9 }, // G4
        4: { freq: 440.00, vowel: 'ah', length: 0.7 }, // A4
        8: { freq: 493.88, vowel: 'ee', length: 1.1 }, // B4
        16: { freq: 523.25, vowel: 'ee', length: 0.8 }, // C5
        20: { freq: 493.88, vowel: 'oh', length: 0.6 }, // B4
        24: { freq: 440.00, vowel: 'ah', length: 1.0 }, // A4
        32: { freq: 587.33, vowel: 'ah', length: 0.9 }, // D5
        36: { freq: 493.88, vowel: 'ee', length: 0.7 }, // B4
        40: { freq: 392.00, vowel: 'oh', length: 1.2 }, // G4
        48: { freq: 440.00, vowel: 'ah', length: 0.8 }, // A4
        52: { freq: 392.00, vowel: 'ah', length: 0.6 }, // G4
        56: { freq: 329.63, vowel: 'ee', length: 1.4 }, // E4
      };

      if (rockVocalMelody[step]) {
        const note = rockVocalMelody[step];
        triggerVocalNote(ctx, note.freq, time, note.length * stepSecs * 3.2, note.vowel);
      }
    }
  };

  // Play / Pause toggler
  const togglePlay = () => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (sequencerTimerIdRef.current) {
        clearInterval(sequencerTimerIdRef.current);
        sequencerTimerIdRef.current = null;
      }
    } else {
      // Play
      // Resume context if suspended (browser safety)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      setIsPlaying(true);
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      currentStepRef.current = 0;
      
      // Start scheduling loop
      sequencerTimerIdRef.current = window.setInterval(scheduler, lookaheadInterval);
    }
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (sequencerTimerIdRef.current) {
        clearInterval(sequencerTimerIdRef.current);
      }
    };
  }, []);

  // Update track specific fader values
  const updateTrackVolume = (id: TrackId, vol: number) => {
    setTracks(prev => ({
      ...prev,
      [id]: { ...prev[id], volume: vol }
    }));
  };

  const updateTrackPan = (id: TrackId, pan: number) => {
    setTracks(prev => ({
      ...prev,
      [id]: { ...prev[id], pan }
    }));
  };

  const toggleTrackMute = (id: TrackId) => {
    setTracks(prev => {
      const current = prev[id];
      // Solo turns off if we mute
      return {
        ...prev,
        [id]: { ...current, mute: !current.mute, solo: false }
      };
    });
  };

  const toggleTrackSolo = (id: TrackId) => {
    setTracks(prev => {
      const current = prev[id];
      const newSolo = !current.solo;
      return {
        ...prev,
        [id]: { ...current, solo: newSolo, mute: false }
      };
    });
  };

  const updateTrackEQ = (id: TrackId, eqParam: keyof EQState, value: number) => {
    setTracks(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        eq: { ...prev[id].eq, [eqParam]: value }
      }
    }));
  };

  const updateTrackCompressor = (id: TrackId, compParam: keyof CompressorState, value: any) => {
    setTracks(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        compressor: { ...prev[id].compressor, [compParam]: value }
      }
    }));
  };

  const updateTrackSends = (id: TrackId, sendType: 'reverbSend' | 'delaySend', value: number) => {
    setTracks(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [sendType]: value
      }
    }));
  };

  // Master bus updates
  const updateMasterVolume = (vol: number) => {
    setMaster(prev => ({ ...prev, volume: vol }));
  };

  const updateMasterLimiterThreshold = (thresh: number) => {
    setMaster(prev => ({ ...prev, limiterThreshold: thresh }));
  };

  // Mistakes togglers
  const toggleMistake = (mistakeName: keyof MistakeState) => {
    setMistakes(prev => ({
      ...prev,
      [mistakeName]: !prev[mistakeName]
    }));
  };

  const clearAllMistakes = () => {
    setMistakes({
      muddyLowEnd: false,
      sausageMaster: false,
      washedReverb: false,
      harshHighs: false,
      phaseCancellation: false,
      boxyMidrange: false,
      chokedDrums: false,
      dullMaster: false,
      excessiveStereoWidening: false,
    });
  };

  // Load target presets for tutorial tasks
  const loadPreset = (presetName: 'unmixed' | 'vocal_mix' | 'guitar_mix' | 'master_mix') => {
    initAudio();
    if (presetName === 'unmixed') {
      clearAllMistakes();
      setTracks({
        vocals: {
          ...initialTrackState('vocals', 'Lead Vocals'),
          volume: 0.9,
          eq: { highPass: 20, lowShelf: 0, midFreq: 1500, midGain: 0, highShelf: 0 },
          compressor: { threshold: 0, ratio: 2, attack: 0.03, release: 0.15, bypass: true },
          reverbSend: 0,
          delaySend: 0,
        },
        guitar: {
          ...initialTrackState('guitar', 'Acoustic Guitar'),
          volume: 1.0,
          pan: 0, // Mono muddy guitar!
          eq: { highPass: 20, lowShelf: 4, midFreq: 250, midGain: 6, highShelf: 0 }, // Boomy EQ
          compressor: { threshold: 0, ratio: 2, attack: 0.03, release: 0.15, bypass: true },
          reverbSend: 0,
        },
        drums: {
          ...initialTrackState('drums', 'Drums (Groove)'),
          volume: 0.7,
          eq: { highPass: 20, lowShelf: 0, midFreq: 1500, midGain: 0, highShelf: 0 },
        },
        bass: {
          ...initialTrackState('bass', 'Bass Guitar'),
          volume: 0.9,
          eq: { highPass: 20, lowShelf: 0, midFreq: 1500, midGain: 0, highShelf: 0 },
        }
      });
      setMaster({ volume: 0.8, limiterThreshold: 0 });
    } else if (presetName === 'vocal_mix') {
      clearAllMistakes();
      setTracks(prev => ({
        ...prev,
        vocals: {
          ...prev.vocals,
          volume: 0.8,
          eq: { highPass: 120, lowShelf: -2, midFreq: 3000, midGain: 2, highShelf: 3 }, // Nice vocal curve
          compressor: { threshold: -20, ratio: 3.5, attack: 0.02, release: 0.15, bypass: false }, // Dynamic control
          reverbSend: 0.35, // Beautiful space
          delaySend: 0.2,
        }
      }));
    } else if (presetName === 'guitar_mix') {
      clearAllMistakes();
      setTracks(prev => ({
        ...prev,
        guitar: {
          ...prev.guitar,
          volume: 0.7,
          pan: -0.75, // Wide panning!
          eq: { highPass: 100, lowShelf: -3, midFreq: 800, midGain: -2, highShelf: 2 }, // Carved low end and mid
          reverbSend: 0.15,
        }
      }));
    } else if (presetName === 'master_mix') {
      clearAllMistakes();
      // Balanced full mix
      setTracks({
        vocals: {
          ...initialTrackState('vocals', 'Lead Vocals'),
          volume: 0.8,
          pan: 0,
          eq: { highPass: 120, lowShelf: -1, midFreq: 3200, midGain: 2.5, highShelf: 3 },
          compressor: { threshold: -18, ratio: 3.0, attack: 0.02, release: 0.12, bypass: false },
          reverbSend: 0.3,
          delaySend: 0.15,
        },
        guitar: {
          ...initialTrackState('guitar', 'Acoustic Guitar'),
          volume: 0.75,
          pan: -0.65,
          eq: { highPass: 110, lowShelf: -3, midFreq: 800, midGain: -2, highShelf: 1 },
          compressor: { threshold: -12, ratio: 2.0, attack: 0.03, release: 0.2, bypass: false },
          reverbSend: 0.15,
          delaySend: 0,
        },
        drums: {
          ...initialTrackState('drums', 'Drums (Groove)'),
          volume: 0.8,
          pan: 0,
          eq: { highPass: 30, lowShelf: 1, midFreq: 2500, midGain: 1, highShelf: 0 },
          compressor: { threshold: -10, ratio: 2.5, attack: 0.05, release: 0.1, bypass: false },
          reverbSend: 0.08,
          delaySend: 0,
        },
        bass: {
          ...initialTrackState('bass', 'Bass Guitar'),
          volume: 0.85,
          pan: 0.05,
          eq: { highPass: 30, lowShelf: 2, midFreq: 700, midGain: -1, highShelf: -2 },
          compressor: { threshold: -14, ratio: 4.0, attack: 0.02, release: 0.25, bypass: false },
          reverbSend: 0.02,
          delaySend: 0,
        }
      });
      setMaster({ volume: 0.8, limiterThreshold: -1.5 });
    }
  };

  return {
    isPlaying,
    isAudioReady,
    tracks,
    master,
    mistakes,
    selectedTrackId,
    peakLevels,
    analyserNode: analyserRef.current,
    limiterNode: limiterRef.current,
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
    updateMasterLimiterThreshold,
    toggleMistake,
    clearAllMistakes,
    loadPreset,
    genre,
    setGenre,
  };
};
