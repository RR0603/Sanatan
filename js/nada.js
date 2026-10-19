// Nada: a soft generative tanpura drone (Pa · Sa · Sa · low Sa, tuned to Sa = 136.1 Hz, the "Om" tone) and
// temple-bell chimes for moments like finding a graha. Pure Web Audio, no sound files.
window.LS = window.LS || {};

LS.Nada = (function () {
  const SA = 136.1;
  let ac = null, master = null, verb = null, on = false, timer = null, step = 0, pad = null;

  function impulse(seconds, decay) {
    const len = Math.floor(ac.sampleRate * seconds), buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function setup() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    verb = ac.createConvolver(); verb.buffer = impulse(3.2, 2.6);
    const wet = ac.createGain(); wet.gain.value = 0.55;
    master.connect(comp); master.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(ac.destination);
    return true;
  }

  // One tanpura string: a buzzy (jawari) sawtooth pair through a closing low-pass, long natural decay.
  function pluck(freq, when, level) {
    const g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(2600, when); f.frequency.exponentialRampToValueAtTime(420, when + 3.5);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(level, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 5.5);
    for (const det of [-4, 3.5]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
      o.connect(f); o.start(when); o.stop(when + 5.6);
    }
    f.connect(g); g.connect(master);
  }
  const CYCLE = [SA * 0.75, SA, SA, SA / 2]; // Pa (mandra), Sa, Sa, Sa (mandra)
  function tick() {
    if (!on) return;
    const now = ac.currentTime + 0.05;
    pluck(CYCLE[step % 4], now, step % 4 === 3 ? 0.16 : 0.11);
    step++;
    timer = setTimeout(tick, step % 4 === 0 ? 1700 : 1150);
  }
  // A faint shruti-box pad underneath, breathing slowly.
  function startPad() {
    const g = ac.createGain(); g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.035, ac.currentTime + 4);
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 0.012; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    const oscs = [SA, SA * 1.5, SA * 2].map((fq) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = fq; o.connect(g); o.start(); return o; });
    g.connect(master);
    pad = { g, oscs: [...oscs, lfo] };
  }
  function stopPad() {
    if (!pad) return;
    const p = pad; pad = null;
    p.g.gain.cancelScheduledValues(ac.currentTime);
    p.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.6);
    setTimeout(() => p.oscs.forEach((o) => { try { o.stop(); } catch (e) { /* stopped */ } }), 3000);
  }

  function start() {
    if (!setup()) return false;
    if (ac.state === 'suspended') ac.resume();
    if (on) return true;
    on = true; step = 0;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0.9, ac.currentTime, 1.2);
    startPad(); tick();
    return true;
  }
  function stop() {
    if (!on) return;
    on = false; clearTimeout(timer);
    stopPad();
    master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.8);
  }
  // A small temple bell (inharmonic partials). kind: 'found' | 'tap'
  function chime(kind = 'tap') {
    if (!ac || !on) return;
    const now = ac.currentTime, base = kind === 'found' ? SA * 8 : SA * 6;
    [[1, 0.09], [2.76, 0.05], [5.4, 0.025], [8.93, 0.012]].forEach(([r, lv]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = base * r;
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(lv * (kind === 'found' ? 1.4 : 0.7), now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'found' ? 4 : 2.2) / r ** 0.3);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 4.5);
    });
  }
  // Pause with the page (and resume) so the drone never plays from a background tab.
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else if (on) ac.resume();
  });

  return { start, stop, chime, get on() { return on; }, supported: !!(window.AudioContext || window.webkitAudioContext) };
})();
