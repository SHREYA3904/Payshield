/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio API Cinematic Galactic Synthesizer for PayShield
 * Zero external audio files or network dependencies.
 * Synthesizes a warm, lush, multi-voice ambient galactic soundscape (D minor pad chords
 * at 146.8Hz, 220Hz, 293.6Hz, 349.2Hz, 440Hz, ethereal celestial overtones at 880Hz,
 * cosmic stellar wind, and resonant filter sweeps at comfortable audible volume 0.18–0.24).
 * Persists continuously across all page transitions with smooth intensity modulation.
 */

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private shimmerGain: GainNode | null = null;
  private shimmerOsc: OscillatorNode | null = null;
  private shimmerLfo: OscillatorNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isDronePlaying: boolean = false;
  private currentIntensity: number = 0.5;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0 : 0.20;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Modulates soundscape cutoff and gain based on current 3D scene intensity (0.0 to 1.0)
   */
  public setSceneIntensity(intensity: number) {
    this.currentIntensity = Math.max(0, Math.min(1, intensity));
    if (this.isMuted || !this.ctx || !this.filterNode || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const targetFreq = 580 + this.currentIntensity * 750; // 580Hz to 1330Hz audible warm cutoff
    const targetGain = 0.18 + this.currentIntensity * 0.05; // 0.18 to 0.23 comfortable audible volume
    this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.3);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.3);
  }

  /**
   * Starts rich, warm, multi-voice ambient galactic soundscape (D minor pad chord + wind + shimmer)
   */
  public startCosmicDrone() {
    if (this.isDronePlaying) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.isDronePlaying = true;
      const now = ctx.currentTime;

      // Master output gain (calibrated to comfortable audible level 0.20)
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, now);
      const targetGain = this.isMuted ? 0 : 0.20;
      this.masterGain.gain.setTargetAtTime(targetGain, now + 0.05, 1.2);
      this.masterGain.connect(ctx.destination);

      // Warm analog resonant lowpass filter
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(680, now);
      this.filterNode.Q.setValueAtTime(2.4, now);

      // Low frequency LFO to gently breathe filter cutoff (0.06 Hz, ~16s cycle)
      this.lfoOsc = ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(0.06, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, now);
      this.lfoOsc.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      this.lfoOsc.start(now);

      // Sub-gain for the lush pad chord
      this.padGain = ctx.createGain();
      this.padGain.gain.setValueAtTime(0.85, now);
      this.padGain.connect(this.filterNode);
      this.filterNode.connect(this.masterGain);

      // Lush Cinematic D-Minor Space Chord Voices (Audible across laptop & desktop speakers)
      // D3 = 146.83 Hz (fundamental root)
      // A3 = 220.00 Hz (perfect fifth)
      // D4 = 293.66 Hz (octave)
      // F4 = 349.23 Hz (minor third)
      // A4 = 440.00 Hz (upper fifth)
      const chordVoices: Array<{ freq: number; type: OscillatorType; detune: number; gain: number }> = [
        { freq: 146.83, type: 'sawtooth', detune: -3, gain: 0.22 },
        { freq: 146.83, type: 'triangle', detune: 3, gain: 0.25 },
        { freq: 220.00, type: 'sine', detune: 1.5, gain: 0.20 },
        { freq: 293.66, type: 'triangle', detune: -2, gain: 0.16 },
        { freq: 349.23, type: 'sine', detune: 2, gain: 0.15 },
        { freq: 440.00, type: 'sine', detune: -1, gain: 0.12 },
      ];

      chordVoices.forEach((voice) => {
        const osc = ctx.createOscillator();
        osc.type = voice.type;
        osc.frequency.setValueAtTime(voice.freq, now);
        osc.detune.setValueAtTime(voice.detune, now);

        const vGain = ctx.createGain();
        vGain.gain.setValueAtTime(voice.gain, now);

        osc.connect(vGain);
        vGain.connect(this.padGain!);
        osc.start(now);
        this.oscillators.push(osc);
      });

      // Ethereal Shimmering Celestial Voice (A5 = 880 Hz with slow tremolo)
      this.shimmerOsc = ctx.createOscillator();
      this.shimmerOsc.type = 'sine';
      this.shimmerOsc.frequency.setValueAtTime(880, now);

      this.shimmerGain = ctx.createGain();
      this.shimmerGain.gain.setValueAtTime(0.04, now);

      this.shimmerLfo = ctx.createOscillator();
      this.shimmerLfo.type = 'sine';
      this.shimmerLfo.frequency.setValueAtTime(0.12, now);
      const sLfoGain = ctx.createGain();
      sLfoGain.gain.setValueAtTime(0.025, now);
      this.shimmerLfo.connect(sLfoGain);
      sLfoGain.connect(this.shimmerGain.gain);

      this.shimmerOsc.connect(this.shimmerGain);
      this.shimmerGain.connect(this.masterGain);

      this.shimmerOsc.start(now);
      this.shimmerLfo.start(now);

      // Procedural Cosmic Stellar Wind (Continuous atmospheric noise bed)
      const windBufferSize = ctx.sampleRate * 4;
      const windBuffer = ctx.createBuffer(1, windBufferSize, ctx.sampleRate);
      const windData = windBuffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < windBufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.05;
        b2 = 0.85 * b2 + white * 0.05;
        windData[i] = (b0 + b1 + b2) * 0.4;
      }

      this.windNode = ctx.createBufferSource();
      this.windNode.buffer = windBuffer;
      this.windNode.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(450, now);
      windFilter.Q.setValueAtTime(2.2, now);

      this.windGain = ctx.createGain();
      this.windGain.gain.setValueAtTime(0, now);
      this.windGain.gain.setTargetAtTime(0.05, now + 0.5, 2.0);

      this.windNode.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.windNode.start(now);
    } catch (e) {
      console.warn('Web Audio galactic synthesizer setup prevented:', e);
    }
  }

  /**
   * Localized spatial gravitational energy ripple on click
   */
  public playEnergyRipple(panX = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.45);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panX)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Deep cinematic security pulse when the central PayShield planet/shield is activated
   */
  public playPlanetPulse() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub-impact boom
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.85);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.16, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.9);

      // Resonant cyber harmonics (ruby pulse: D4, A4, D5)
      const harmFreqs = [293.66, 440.0, 587.33, 880.0];
      harmFreqs.forEach((f, idx) => {
        const hOsc = ctx.createOscillator();
        hOsc.type = 'sine';
        hOsc.frequency.setValueAtTime(f, now);

        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.05 / (idx + 1), now);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7 + idx * 0.1);

        hOsc.connect(hGain);
        hGain.connect(ctx.destination);
        hOsc.start(now);
        hOsc.stop(now + 0.8 + idx * 0.1);
      });
    } catch (e) {}
  }

  /**
   * Cinematic space warp sound for scene explosion transition
   */
  public playTransitionWarp() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 1.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(240, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.55);
      noiseFilter.frequency.exponentialRampToValueAtTime(320, now + 1.2);
      noiseFilter.Q.setValueAtTime(3.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.14, now + 0.35);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 1.2);

      const freqs = [220.0, 329.63, 440.0, 659.25, 880.0];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f * 0.8, now);
        osc.frequency.exponentialRampToValueAtTime(f, now + 0.4 + idx * 0.08);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.06, now + 0.3 + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        if (ctx.createStereoPanner) {
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(idx % 2 === 0 ? -0.4 : 0.4, now);
          osc.connect(g);
          g.connect(panner);
          panner.connect(ctx.destination);
        } else {
          osc.connect(g);
          g.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + 1.3);
      });
    } catch (e) {
      console.warn('Audio warp error:', e);
    }
  }

  /**
   * Spatial slide whoosh when navigating cards
   */
  public playCardSlide(panDirection: 'left' | 'right' | 'neutral' = 'right') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.38;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const startFreq = panDirection === 'right' ? 440 : 880;
      const endFreq = panDirection === 'right' ? 980 : 480;
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      filter.Q.setValueAtTime(2.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      let pannerNode: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        pannerNode = ctx.createStereoPanner();
        const startPan = panDirection === 'right' ? -0.5 : panDirection === 'left' ? 0.5 : 0;
        const endPan = panDirection === 'right' ? 0.5 : panDirection === 'left' ? -0.5 : 0;
        pannerNode.pan.setValueAtTime(startPan, now);
        pannerNode.pan.linearRampToValueAtTime(endPan, now + duration);
      }

      noise.connect(filter);
      filter.connect(gain);
      if (pannerNode) {
        gain.connect(pannerNode);
        pannerNode.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      noise.start(now);
      noise.stop(now + duration);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const toneFreq = panDirection === 'right' ? 880 : 659.25;
      osc.frequency.setValueAtTime(toneFreq, now);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.03, now);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(toneGain);
      toneGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  /**
   * Crystalline celestial chime triggered on hover / card focus
   */
  public playCelestialChime(noteIdx = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const scale = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
      const freq = scale[Math.abs(noteIdx) % scale.length];

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      if (ctx.createStereoPanner) {
        const pan = ctx.createStereoPanner();
        pan.pan.setValueAtTime((Math.random() - 0.5) * 0.8, now);
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  public dispose() {
    try {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (_) {}
      });
      this.oscillators = [];
      if (this.lfoOsc) this.lfoOsc.stop();
      if (this.shimmerOsc) this.shimmerOsc.stop();
      if (this.shimmerLfo) this.shimmerLfo.stop();
      if (this.windNode) this.windNode.stop();
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => {});
      }
    } catch (e) {}
    this.isDronePlaying = false;
    this.ctx = null;
  }
}

export const spatialAudio = new SpatialAudioEngine();
