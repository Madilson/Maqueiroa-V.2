/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Web Audio API Sound Generator to avoid external asset dependency failures
export function playHospitalBell() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First note
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 1.3);

    // Second note (harmonized slight delay)
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain2.gain.setValueAtTime(0, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 1.3);
      } catch (err) {}
    }, 250);

  } catch (error) {
    console.warn("Dispositivo ou navegador bloqueou o áudio ou API indisponível:", error);
  }
}

export function playEmergencySiren() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    // Siren effect modulation
    osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.4);
    osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.8);
    osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 1.2);
    osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 1.6);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 2.0);
  } catch (error) {
    console.warn("Dispositivo de som indisponível:", error);
  }
}

export function playSuccessChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (error) {
    console.warn("Áudio mudo:", error);
  }
}
