/**
 * Gentle ambient sound, started only from a user gesture.
 * With no audio file configured it synthesises a soft tanpura drone with an
 * occasional distant temple bell — original sound, nothing to license.
 */
export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: AudioNode | null = null;
  private timers: number[] = [];
  private element: HTMLAudioElement | null = null;
  private running = false;

  constructor(private readonly src: string | null) {}

  get isRunning() {
    return this.running;
  }

  async start(): Promise<boolean> {
    if (this.running) return true;
    try {
      if (this.src) return await this.startFile(this.src);
      return await this.startSynth();
    } catch {
      this.stop();
      return false;
    }
  }

  stop() {
    this.running = false;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    if (this.element) {
      this.element.pause();
    }
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.25);
      const ctx = this.ctx;
      window.setTimeout(() => void ctx.suspend().catch(() => undefined), 1200);
    }
  }

  dispose() {
    this.stop();
    this.element = null;
    if (this.ctx) void this.ctx.close().catch(() => undefined);
    this.ctx = null;
  }

  private async startFile(src: string) {
    if (!this.element) {
      this.element = new Audio(src);
      this.element.loop = true;
      this.element.volume = 0.5;
    }
    await this.element.play();
    this.running = true;
    return true;
  }

  private async startSynth() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    if (!this.ctx) {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.impulse(3.2);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.55;
      const dry = this.ctx.createGain();
      dry.gain.value = 0.6;
      const input = this.ctx.createGain();
      input.connect(dry).connect(this.master);
      input.connect(reverb).connect(wet).connect(this.master);
      this.master.connect(this.ctx.destination);
      this.bus = input;
    }
    await this.ctx.resume();
    this.running = true;
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setTargetAtTime(0.22, now, 1.2);
    this.scheduleTanpura();
    this.scheduleBell(6000);
    return true;
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  }

  /** Pa – Sa – Sa – low Sa, the classic tanpura cycle. */
  private scheduleTanpura() {
    const sa = 138.59; // C#3
    const cycle = [sa * 0.75, sa, sa, sa / 2];
    let step = 0;
    const tick = () => {
      if (!this.running || !this.ctx || !this.bus) return;
      this.pluck(cycle[step % cycle.length]);
      step++;
      this.timers.push(window.setTimeout(tick, step % 4 === 0 ? 1700 : 1050));
    };
    tick();
  }

  private pluck(freq: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + 3);
    filter.Q.value = 2.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 4.2);
    filter.connect(gain).connect(this.bus!);
    for (const detune of [-4, 3]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 4.4);
    }
  }

  private scheduleBell(delay: number) {
    this.timers.push(
      window.setTimeout(() => {
        if (!this.running) return;
        this.bell();
        this.scheduleBell(14000 + Math.random() * 9000);
      }, delay),
    );
  }

  private bell() {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    const base = 554.37;
    [1, 2.0, 2.76, 5.4, 8.93].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * ratio;
      const g = ctx.createGain();
      const peak = 0.035 / (i + 1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5 / (1 + i * 0.6));
      osc.connect(g).connect(this.bus!);
      osc.start(t);
      osc.stop(t + 5.2);
    });
  }
}
