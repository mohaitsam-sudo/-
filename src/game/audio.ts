/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio Engine for Mohamed Haitham Bus Simulator 3D
 * - Diesel Engine simulation (idle, acceleration, RPM pitch tracking)
 * - Pneumatic air brakes release ("psssht")
 * - Bus Air Horn (classic Egyptian bus tone)
 * - Pneumatic Door open/close sound
 * - Passenger boarding chime and coin fare drop
 * - Air Conditioning (A/C) blower hum
 * - Turn signal blinker relay click
 * - Interactive Bus Radio with 4 procedural musical stations
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private acGain: GainNode | null = null;
  private acSource: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private radioGain: GainNode | null = null;
  private currentRadioStation: number = 0; // 0: Off, 1: Shaabi Beat, 2: Classic Tarab, 3: News/Talk, 4: Modern Pop
  private radioInterval: number | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Setup Engine Synthesis
      this.setupEngine();
      // Setup AC
      this.setupAC();

      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.radioGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch {
      // AudioContext may be blocked until user gesture
    }
  }

  private setupEngine() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Deep diesel engine rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(32, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(48, this.ctx.currentTime);

    // Subtle distortion for diesel punch
    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; ++i) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.tanh(x * 2.5);
    }
    shaper.curve = curve;

    this.engineOsc1.connect(shaper);
    this.engineOsc2.connect(shaper);
    shaper.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private setupAC() {
    if (!this.ctx || !this.masterGain) return;
    // Procedural pink noise for A/C
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.04;
    }

    this.acGain = this.ctx.createGain();
    this.acGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.acSource = this.ctx.createBufferSource();
    this.acSource.buffer = buffer;
    this.acSource.loop = true;
    this.acSource.connect(filter);
    filter.connect(this.acGain);
    this.acGain.connect(this.masterGain);
    this.acSource.start();
  }

  public updateEngine(speedKmh: number, throttle: number, isBraking: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    const baseFreq = 28;
    const targetFreq = baseFreq + Math.abs(speedKmh) * 1.4 + throttle * 25;
    const filterFreq = 110 + Math.abs(speedKmh) * 9 + throttle * 280;
    const volume = 0.07 + (throttle > 0 ? 0.09 : 0.02) + Math.min(0.08, Math.abs(speedKmh) * 0.001);

    const time = this.ctx.currentTime + 0.05;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, time, 0.1);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, time, 0.1);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, time, 0.1);
    this.engineGain.gain.setTargetAtTime(this.isMuted ? 0 : volume, time, 0.1);

    if (isBraking && speedKmh > 10 && Math.random() < 0.02) {
      this.playAirBrake(0.2);
    }
  }

  public playAirBrake(intensity: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * intensity, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  public playHorn(start: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (start) {
      // Classic Egyptian dual-tone bus horn (370Hz and 440Hz brassy sound)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(370, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(444, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start();
      osc2.start();

      (this as unknown as { _activeHorn?: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } })._activeHorn = { osc1, osc2, gain };
    } else {
      const active = (this as unknown as { _activeHorn?: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } })._activeHorn;
      if (active) {
        active.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          try {
            active.osc1.stop();
            active.osc2.stop();
          } catch {
            // Already stopped
          }
        }, 100);
        (this as unknown as { _activeHorn?: undefined })._activeHorn = undefined;
      }
    }
  }

  public playDoorSound(isOpen: boolean) {
    this.playAirBrake(0.4);
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = isOpen ? 320 : 480;
    const endFreq = isOpen ? 480 : 320;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  public playCoinDing() {
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  public playClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public setACLevel(level: number) { // 0: Off, 1: Low, 2: Med, 3: High
    if (!this.ctx || !this.acGain) return;
    const volumes = [0, 0.03, 0.07, 0.12];
    const vol = volumes[level] || 0;
    this.acGain.gain.setTargetAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime, 0.2);
  }

  public cycleRadioStation(): { stationId: number; stationName: string } {
    this.currentRadioStation = (this.currentRadioStation + 1) % 5;
    this.updateRadioPlayback();
    const names = [
      'مغلق (Off)',
      'محطة شعبي مصر (Shaabi 90.9)',
      'طرب زمان والنيل (Tarab Classic)',
      'إذاعة الشرق الأوسط (News & Cairo Talk)',
      'نجوم إف إم (Cairo Hits FM)',
    ];
    return {
      stationId: this.currentRadioStation,
      stationName: names[this.currentRadioStation],
    };
  }

  public getRadioStation(): number {
    return this.currentRadioStation;
  }

  private updateRadioPlayback() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
    if (!this.ctx || !this.radioGain || this.currentRadioStation === 0 || this.isMuted) {
      return;
    }

    // Procedural musical arpeggiator for Egyptian bus radio feel
    let step = 0;
    const scales: Record<number, number[]> = {
      // Shaabi (Bayati maqam notes: D, E-half-flat ~293, 310, F 349, G 392, A 440)
      1: [293.66, 315.0, 349.23, 392.0, 440.0, 392.0, 349.23, 315.0],
      // Classic Tarab (Rast/Nahawand: C, D, Eb, F, G, Ab, B)
      2: [261.63, 293.66, 311.13, 349.23, 392.0, 415.3, 493.88, 523.25],
      // News / Talk radio (vocalized synthetic voice chatter bursts)
      3: [196.0, 220.0, 246.94, 261.63, 220.0, 196.0, 246.94, 196.0],
      // Modern Cairo Pop (A minor synth pop)
      4: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 329.63, 261.63],
    };

    const notes = scales[this.currentRadioStation] || scales[1];
    const speedMs = this.currentRadioStation === 1 ? 220 : this.currentRadioStation === 2 ? 380 : this.currentRadioStation === 3 ? 180 : 250;

    this.radioInterval = window.setInterval(() => {
      if (!this.ctx || !this.radioGain || this.isMuted) return;
      const freq = notes[step % notes.length];
      step++;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      if (this.currentRadioStation === 1) {
        osc.type = 'sawtooth';
      } else if (this.currentRadioStation === 2) {
        osc.type = 'triangle';
      } else if (this.currentRadioStation === 3) {
        osc.type = 'square';
      } else {
        osc.type = 'sawtooth';
      }

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (speedMs / 1000) * 0.9);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.radioGain!);

      osc.start();
      osc.stop(this.ctx.currentTime + (speedMs / 1000));
    }, speedMs);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.1);
    }
    if (muted && this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    } else if (!muted && this.currentRadioStation > 0) {
      this.updateRadioPlayback();
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export const audioSystem = new SoundSystem();
