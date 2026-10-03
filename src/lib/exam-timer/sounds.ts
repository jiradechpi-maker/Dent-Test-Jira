/**
 * Exam sounds synthesised with the Web Audio API — no audio files, works offline,
 * and is loud enough for a lecture hall: a ding-dong when the exam starts, a ringing
 * bell when time is up, and a choice of chimes for the 5-minute warning.
 */

export type ExamSound = "start" | "end";

/** Chimes the staff can choose for the 5-minute warning. */
export const CHIME_STYLES = ["dingdong", "triple", "bell", "school", "beep", "none"] as const;
export type ChimeStyle = (typeof CHIME_STYLES)[number];

export const CHIME_LABELS: Record<ChimeStyle, { th: string; en: string }> = {
  dingdong: { th: "ดิ๊ง-ด่อง", en: "Ding-dong" },
  triple: { th: "กริ่ง 3 โน้ต (แบบสนามบิน)", en: "Three-note chime" },
  bell: { th: "ระฆัง", en: "Bell" },
  school: { th: "กริ่งโรงเรียน", en: "School bell" },
  beep: { th: "บี๊ป 3 ครั้ง", en: "Three beeps" },
  none: { th: "ไม่มีเสียงกริ่ง (ขึ้นข้อความอย่างเดียว)", en: "No chime (on-screen text only)" },
};

let context: AudioContext | null = null;
let master: GainNode | null = null;

type AudioContextCtor = typeof AudioContext;

function getContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Creates or wakes the audio engine. Call it from a click once so later automatic sounds may play; after that
 * it can also be called without a click to wake an engine the browser suspended (Safari reports "interrupted").
 */
export async function unlockAudio(): Promise<boolean> {
  const Ctor = getContextCtor();
  if (!Ctor) return false;
  if (context?.state === "closed") {
    context = null;
    master = null;
  }
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
  if (context.state !== "running") {
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

/** A short electronic beep. */
function beep(ctx: AudioContext, out: AudioNode, at: number, frequency: number, seconds: number, level: number): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + 0.01);
  env.gain.setValueAtTime(level, at + seconds - 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + seconds + 0.05);
}

function ready(): { ctx: AudioContext; out: GainNode; t: number } | null {
  if (!context || !master || context.state !== "running") return null;
  return { ctx: context, out: master, t: context.currentTime + 0.05 };
}

/** Plays the start or end signal. Returns its approximate duration in seconds (0 if audio is unavailable). */
export function playSound(kind: ExamSound): number {
  const r = ready();
  if (!r) return 0;
  const { ctx, out, t } = r;
  if (kind === "start") {
    // Rising two-tone "ding-dong": G5 → C6
    strike(ctx, out, t, 783.99, 0.7, 1.6);
    strike(ctx, out, t + 0.45, 1046.5, 0.7, 2.2);
    return 2.6;
  }
  // Three-tone chime, then two long bell rings — unmistakable "time is up".
  strike(ctx, out, t, 1046.5, 0.8, 1.6);
  strike(ctx, out, t + 0.4, 783.99, 0.8, 1.6);
  strike(ctx, out, t + 0.8, 523.25, 0.9, 2.4);
  ring(ctx, out, t + 2.2, 2.2);
  ring(ctx, out, t + 5.0, 2.2);
  return 7.6;
}

/** Plays the 5-minute chime. Returns its length in seconds (0 for "none" or when audio is locked). */
export function playChime(style: ChimeStyle): number {
  if (style === "none") return 0;
  const r = ready();
  if (!r) return 0;
  const { ctx, out, t } = r;
  switch (style) {
    case "dingdong":
      // E6 → C6
      strike(ctx, out, t, 1318.5, 0.6, 1.3);
      strike(ctx, out, t + 0.45, 1046.5, 0.6, 1.6);
      return 1.8;
    case "triple":
      // Rising C5 – E5 – G5, the familiar public-address chime.
      strike(ctx, out, t, 523.25, 0.75, 1.4);
      strike(ctx, out, t + 0.38, 659.25, 0.75, 1.4);
      strike(ctx, out, t + 0.76, 783.99, 0.75, 1.8);
      return 2.3;
    case "bell":
      strike(ctx, out, t, 880, 0.85, 2.6);
      return 2.4;
    case "school":
      ring(ctx, out, t, 1.4);
      return 1.6;
    case "beep":
      for (const offset of [0, 0.35, 0.7]) beep(ctx, out, t + offset, 1046.5, 0.18, 0.5);
      return 1.0;
  }
}

export function isAudioReady(): boolean {
  return context?.state === "running";
}
