// Real Web Audio API High-Decibel Siren Sound Generator for wildlife deterrence

let audioCtx = null;

export function playSirenSound(durationSeconds = 3) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    // Ensure audio context is active (browsers suspend AudioContext until user interaction)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';

    // High-decibel police & deterrence siren sweep (1200Hz <-> 2800Hz)
    const cycles = Math.max(1, Math.floor(durationSeconds * 3));
    const cycleTime = durationSeconds / cycles;

    for (let i = 0; i < cycles; i++) {
      const startTime = now + i * cycleTime;
      const midTime = startTime + cycleTime / 2;
      osc.frequency.setValueAtTime(1200, startTime);
      osc.frequency.linearRampToValueAtTime(2800, midTime);
      osc.frequency.linearRampToValueAtTime(1200, startTime + cycleTime);
    }

    // High volume envelope (0.8 max gain for loud audio)
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + durationSeconds);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);
  } catch (err) {
    console.warn('AudioContext siren error:', err);
  }
}
