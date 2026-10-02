/**
 * Exam sounds synthesised with the Web Audio API — no audio files, works offline,
 * and is loud enough for a lecture hall. The palette follows international exam-hall
 * conventions: a soft two-tone chime for warnings and a ringing bell for "time is up".
 */

export type ExamSound = "start" | "warning" | "end";

let context: AudioContext | null = null;
let master: GainNode | null = null;

type AudioContextCtor = typeof AudioContext;

function getContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Must be called from a user gesture (click) once, so later automatic sounds are allowed to play. */
export async function unlockAudio(): Promise<boolean> {
  const Ctor = getContextCtor();
  if (!Ctor) return false;
  if (!context) {
    context = new Ctor();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 6;
    compressor.ratio.value = 4;
    master = context.createGain();
    master.gain.value = 0.8;
    master.connect(compressor).connect(context.destination);
  }
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }
  return context.state === "running";
}

export function setVolume(volume: number): void {
  if (master && context) master.gain.setTargetAtTime(Math.min(1, Math.max(0, volume)), context.currentTime, 0.02);
}

/** A struck bell: inharmonic partials with exponential decay. */
function strike(ctx: AudioContext, out: AudioNode, at: number, frequency: number, level: number, decay: number): void {
  const partials: [ratio: number, gain: number][] = [
    [1, 1],
    [2.0, 0.55],
    [2.76, 0.35],
    [4.07, 0.2],
    [5.4, 0.12],
  ];
  for (const [ratio, gain] of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency * ratio;
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level * gain, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay / ratio ** 0.35);
    osc.connect(env).connect(out);
    osc.start(at);
    osc.stop(at + decay + 0.1);
  }
}

/** Classic electric school bell: a hammer striking ~18 times per second. */
function ring(ctx: AudioContext, out: AudioNode, at: number, seconds: number): void {
  const rate = 18;
  const count = Math.floor(seconds * rate);
  for (let i = 0; i < count; i += 1) {
    strike(ctx, out, at + i / rate, 1318.5, 0.32, 0.45); // E6
  }
}

/** Plays a sound. Returns its approximate duration in seconds (0 if audio is unavailable). */
export function playSound(kind: ExamSound): number {
  if (!context || !master || context.state !== "running") return 0;
  const ctx = context;
  const out = master;
  const t = ctx.currentTime + 0.05;

  switch (kind) {
    case "start": {
      // Rising two-tone "ding-dong": G5 → C6
      strike(ctx, out, t, 783.99, 0.7, 1.6);
      strike(ctx, out, t + 0.45, 1046.5, 0.7, 2.2);
      return 2.6;
    }
    case "warning": {
      // Falling two-tone chime played twice: E6 → C6
      for (const offset of [0, 1.4]) {
        strike(ctx, out, t + offset, 1318.5, 0.6, 1.4);
        strike(ctx, out, t + offset + 0.42, 1046.5, 0.6, 1.8);
      }
      return 3.4;
    }
    case "end": {
      // Three-tone chime, then two long bell rings — unmistakable "time is up".
      strike(ctx, out, t, 1046.5, 0.8, 1.6);
      strike(ctx, out, t + 0.4, 783.99, 0.8, 1.6);
      strike(ctx, out, t + 0.8, 523.25, 0.9, 2.4);
      ring(ctx, out, t + 2.2, 2.2);
      ring(ctx, out, t + 5.0, 2.2);
      return 7.6;
    }
  }
}

export function isAudioReady(): boolean {
  return context?.state === "running";
}
