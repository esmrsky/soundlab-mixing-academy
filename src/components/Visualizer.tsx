import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Buffer arrays
    let bufferLength = analyserNode ? analyserNode.frequencyBinCount : 256;
    let dataArray = new Uint8Array(bufferLength);
    let timeArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        analyserNode.getByteTimeDomainData(timeArray);
      } else {
        // Fallback quiet state if not playing
        dataArray.fill(0);
        timeArray.fill(128);
      }

      // Clear with obsidian background
      ctx.fillStyle = '#0a0d1a';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      
      // Vertical grid (logarithmic frequencies: 50, 100, 200, 500, 1k, 2k, 5k, 10k, 20k)
      const freqGrid = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000];
      const logMin = Math.log10(20);
      const logMax = Math.log10(20000);

      freqGrid.forEach(f => {
        const logF = Math.log10(f);
        const ratio = (logF - logMin) / (logMax - logMin);
        const x = ratio * (width * 0.7); // Left 70% is spectrum
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '9px Space Grotesk';
        const label = f >= 1000 ? `${f / 1000}kHz` : `${f}Hz`;
        ctx.fillText(label, x + 4, height - 6);
      });

      // Horizontal grid (dB levels)
      const dBGrid = [0.25, 0.5, 0.75];
      dBGrid.forEach(ratio => {
        const y = ratio * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Split visualizer: Left 70% is Log Spectrum, Right 30% is Waveform oscilloscope

      // 1. DRAW LOGARITHMIC SPECTRUM (Left 70% width)
      const specWidth = width * 0.68;
      ctx.beginPath();
      
      // We will draw a gradient filled spectrum path
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.02)');
      grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.2)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0.65)'); // Golden peaks
      
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.8;

      ctx.moveTo(0, height);

      // Logarithmic scaling for frequency plotting
      for (let i = 0; i < specWidth; i++) {
        // Map pixel x coordinate to logarithmic frequency range 20Hz - 20kHz
        const percent = i / specWidth;
        const logVal = logMin + percent * (logMax - logMin);
        const targetFreq = Math.pow(10, logVal);

        // Find the index in FFT array that corresponds to targetFreq
        // Frequency resolution per bin is Context SampleRate / FFT Size (e.g. 48000 / 512 = 93.75Hz)
        const nyquist = 22050; // Approximated half sample rate
        const binIndex = Math.min(
          bufferLength - 1,
          Math.max(0, Math.floor((targetFreq / nyquist) * bufferLength))
        );

        const val = dataArray[binIndex] / 255.0; // 0 to 1
        const y = height - (val * height * 0.85) - 10; // offset a bit from bottom

        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.lineTo(specWidth, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Redraw top stroke line for glowing effect
      ctx.beginPath();
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#00f2fe';
      
      for (let i = 0; i < specWidth; i++) {
        const percent = i / specWidth;
        const logVal = logMin + percent * (logMax - logMin);
        const targetFreq = Math.pow(10, logVal);
        const nyquist = 22050;
        const binIndex = Math.min(
          bufferLength - 1,
          Math.max(0, Math.floor((targetFreq / nyquist) * bufferLength))
        );
        const val = dataArray[binIndex] / 255.0;
        const y = height - (val * height * 0.85) - 10;

        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Draw Separator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(specWidth + 10, 0);
      ctx.lineTo(specWidth + 10, height);
      ctx.stroke();

      // 2. DRAW WAVEFORM OSCILLOSCOPE (Right 30% width)
      const waveX = specWidth + 15;
      const waveWidth = width - waveX;
      
      ctx.beginPath();
      ctx.strokeStyle = '#fbbf24'; // golden waveform
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.lineWidth = 1.5;

      const sliceWidth = waveWidth / bufferLength;
      let x = waveX;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeArray[i] / 128.0; // 0 to 2
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Oscilloscope title
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '8px Space Grotesk';
      ctx.fillText('TIME WAVEFORM', waveX + 5, 12);
      ctx.fillText('MASTER SPECTRUM', 10, 12);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="glass-panel" style={{ padding: '8px', overflow: 'hidden', border: '1px solid rgba(0, 242, 254, 0.25)', boxShadow: '0 0 15px rgba(0, 242, 254, 0.15)' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '140px', 
          display: 'block', 
          borderRadius: '8px'
        }} 
      />
    </div>
  );
};
