let audioCtx = null;

const initAudio = () => {
  if (audioCtx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  } catch (e) {
    console.error('AudioContext error:', e);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('touchstart', initAudio, { once: true });
}

export const playBeep = () => {
  try {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Função auxiliar para tocar uma nota musical
    const playNote = (frequency, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      // Usando onda 'sine' para um som bem limpo e suave
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Volume: sobe rápido, cai de forma aveludada
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // Volume médio
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Tocando a "musiquinha" (Arpejo Feliz / Sucesso)
    // Notas: Dó (C5), Mi (E5), Sol (G5), Dó Agudo (C6)
    playNote(523.25, now, 0.3);         // Dó
    playNote(659.25, now + 0.12, 0.3);  // Mi
    playNote(783.99, now + 0.24, 0.3);  // Sol
    playNote(1046.50, now + 0.36, 0.6); // Dó Agudo (nota final mais longa)

  } catch (e) {
    console.error('Erro ao tocar musiquinha:', e);
  }
};
