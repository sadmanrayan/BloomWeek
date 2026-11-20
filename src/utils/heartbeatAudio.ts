/**
 * Procedural Web Audio fetal Doppler heartbeat synthesizer.
 * Produces a gentle, warm, muffled underwater "lub-dub" rhythm at the given BPM
 * with zero external audio file dependencies.
 */
export class FetalHeartbeatSynth {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private bpm: number = 150;
  private running: boolean = false;

  public start(bpm: number): void {
    this.bpm = Math.max(80, Math.min(185, bpm));
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    this.running = true;
    this.scheduleLoop();
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(80, Math.min(185, bpm));
  }

  public stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  private scheduleLoop(): void {
    if (!this.running) return;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.triggerBeat();
    const intervalMs = Math.round((60 / this.bpm) * 1000);
    this.timerId = window.setTimeout(() => this.scheduleLoop(), intervalMs);
  }

  private triggerBeat(): void {
    if (!this.ctx || !this.running) return;
    const now = this.ctx.currentTime;

    // "Lub" (primary soft thump) + "Dub" (quick softer echo ~110ms later)
    this.playThump(now, 88, 52, 0.11, 0.14);
    this.playThump(now + 0.115, 76, 46, 0.085, 0.09);
  }

  private playThump(
    startTime: number,
    startFreq: number,
    endFreq: number,
    durationSec: number,
    peakGain: number
  ): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + durationSec);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(165, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.02);
  }
}
