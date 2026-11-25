// All sound is synthesised with WebAudio: no audio files, no network.
// The context is created on the first key press or click, so the game
// stays silent (and error-free) in a headless screenshot run.
let context = null;
let muted = false;
let musicTimer = null;

export function setMuted(value) {
  muted = value;
}

function audioContext() {
  if (muted) return null;
  try {
    if (context === null) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  audioContext();
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ctx = audioContext();
  if (ctx === null) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + when;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  } catch {
    // A headless browser may refuse audio; the game plays on silently.
  }
}

function noiseBurst(seconds, gainValue, filterFreq) {
  const ctx = audioContext();
  if (ctx === null) return;
  try {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  } catch {
    // Audio is decoration; never let it break the game.
  }
}

/** One named sound effect for each kitchen event. */
export function playSound(name) {
  switch (name) {
    case 'grab':
      tone(520, 0.08, 'sine', 0.12);
      break;
    case 'chop-start':
      noiseBurst(0.12, 0.25, 1800);
      tone(180, 0.1, 'square', 0.08);
      break;
    case 'chop-done':
      noiseBurst(0.1, 0.2, 2400);
      tone(660, 0.09, 'sine', 0.1);
      break;
    case 'grill-start':
      noiseBurst(0.5, 0.12, 5000);
      break;
    case 'plate':
      tone(440, 0.07, 'triangle', 0.12);
      tone(660, 0.09, 'triangle', 0.1, 0.06);
      break;
    case 'serve':
      tone(523, 0.12, 'sine', 0.16);
      tone(659, 0.12, 'sine', 0.16, 0.09);
      tone(784, 0.2, 'sine', 0.18, 0.18);
      break;
    case 'coin':
      tone(988, 0.08, 'sine', 0.12);
      tone(1319, 0.14, 'sine', 0.12, 0.07);
      break;
    case 'deny':
      tone(140, 0.18, 'sawtooth', 0.1);
      break;
    case 'expire':
      tone(330, 0.25, 'triangle', 0.14);
      tone(220, 0.35, 'triangle', 0.14, 0.18);
      break;
    case 'burn':
      noiseBurst(0.4, 0.15, 300);
      tone(110, 0.4, 'sawtooth', 0.08);
      break;
    case 'game-over':
      tone(392, 0.2, 'triangle', 0.14);
      tone(311, 0.2, 'triangle', 0.14, 0.18);
      tone(262, 0.45, 'triangle', 0.16, 0.36);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.15, i * 0.12));
      break;
    default:
      break;
  }
}

// A gentle two-bar loop: low plucked bass and a soft chord pad, quiet
// enough to sit under the kitchen sounds.
const BASS = [130.81, 98.0, 110.0, 146.83];
const CHORDS = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]];

export function startMusic() {
  if (musicTimer !== null || muted) return;
  let bar = 0;
  let beat = 0;
  musicTimer = window.setInterval(() => {
    if (muted) return;
    const chord = CHORDS[bar % CHORDS.length];
    if (beat === 0) tone(BASS[bar % BASS.length], 0.5, 'triangle', 0.05);
    if (beat % 2 === 0) chord.forEach((f) => tone(f, 0.4, 'sine', 0.02));
    beat += 1;
    if (beat >= 4) {
      beat = 0;
      bar += 1;
    }
  }, 500);
}

export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
