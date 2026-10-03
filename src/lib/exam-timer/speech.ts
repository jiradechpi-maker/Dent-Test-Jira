/**
 * Spoken announcements with the browser's built-in voices (Web Speech API). Handles the known rough edges:
 * voices that load late, Chrome dropping an utterance queued right after cancel(), Chrome cutting off long
 * utterances, utterances garbage-collected before they finish, and online voices failing on a weak network.
 */

import type { Bi } from "@/lib/i18n/locale";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Voices arrive asynchronously (and Safari never fires `voiceschanged`), so poll briefly as well. */
export function loadVoices(timeoutMs = 5000): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", onChange);
      resolve(synth.getVoices());
    };
    const onChange = () => synth.getVoices().length && finish();
    const poll = window.setInterval(onChange, 250);
    const timeout = window.setTimeout(finish, timeoutMs);
    synth.addEventListener("voiceschanged", onChange);
  });
}

/** Subscribe to voice-list changes (e.g. Edge downloading its online voices). Returns an unsubscribe function. */
export function onVoicesChanged(callback: () => void): () => void {
  if (!speechSupported()) return () => undefined;
  window.speechSynthesis.addEventListener("voiceschanged", callback);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", callback);
}

const isThai = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace("_", "-").startsWith("th");
// Edge occasionally reports half-loaded voices as "Microsoft undefined Online (Natural) - undefined".
const isUsable = (voice: SpeechSynthesisVoice) => !/undefined/i.test(voice.name);

const KNOWN: { pattern: RegExp; name: string; gender: Bi }[] = [
  { pattern: /premwadee/i, name: "Premwadee", gender: { th: "หญิง", en: "female" } },
  { pattern: /niwat/i, name: "Niwat", gender: { th: "ชาย", en: "male" } },
  { pattern: /pattara/i, name: "Pattara", gender: { th: "ชาย", en: "male" } },
  { pattern: /kanya/i, name: "Kanya", gender: { th: "หญิง", en: "female" } },
  { pattern: /narisa/i, name: "Narisa", gender: { th: "หญิง", en: "female" } },
  { pattern: /google/i, name: "Google", gender: { th: "หญิง", en: "female" } },
];

const quality = (voice: SpeechSynthesisVoice) => (/natural|online|neural|premium|enhanced/i.test(voice.name) ? 0 : voice.localService ? 2 : 1);

const knownRank = (voice: SpeechSynthesisVoice) => {
  const index = KNOWN.findIndex((k) => k.pattern.test(voice.name));
  return index === -1 ? KNOWN.length : index;
};

/** Every Thai voice on this computer, the most natural-sounding first (Premwadee leads: the clearest for a room). */
export function thaiVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => isThai(voice) && isUsable(voice))
    .sort((a, b) => quality(a) - quality(b) || knownRank(a) - knownRank(b) || a.name.localeCompare(b.name));
}

/** "Premwadee · หญิง · เสียงธรรมชาติ (ใช้อินเทอร์เน็ต)" */
export function voiceLabel(voice: SpeechSynthesisVoice, locale: "th" | "en"): string {
  const known = KNOWN.find((k) => k.pattern.test(voice.name));
  const name = known?.name ?? voice.name.replace(/^Microsoft\s+/i, "").replace(/\s*-\s*Thai.*$/i, "");
  const parts = [name];
  if (known) parts.push(known.gender[locale]);
  if (quality(voice) === 0) parts.push(locale === "th" ? "เสียงธรรมชาติ ชัดที่สุด (ใช้อินเทอร์เน็ต)" : "natural, clearest (needs internet)");
  else if (voice.localService) parts.push(locale === "th" ? "ในเครื่อง" : "on this computer");
  return parts.join(" · ");
}

/**
 * Chrome stops speaking after ~15 s on a long utterance, so long text is spoken in phrases. Thai has no
 * full stops, so it is split at spaces into phrases of at most `max` characters.
 */
export function splitForSpeech(text: string, max = 160): string[] {
  const chunks: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean)) {
    if (sentence.length <= max) {
      chunks.push(sentence);
      continue;
    }
    let current = "";
    for (const word of sentence.split(/\s+/)) {
      if (current && current.length + word.length + 1 > max) {
        chunks.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks;
}

// Keep live utterances referenced: Chrome may garbage-collect them mid-speech and never fire `end`.
const live = new Set<SpeechSynthesisUtterance>();
let keepAlive: number | null = null;
let generation = 0;
let lastCancelAt = 0;
let primed = false;

/** Chrome silently drops an utterance queued too soon after cancel(), so speech waits this long after one. */
const SETTLE_MS = 250;
/** A voice that hasn't started within this time is treated as silent and the fallback is tried. */
const START_TIMEOUT_MS = 4000;
/** The breath between phrases — about what a person leaves between clauses when announcing. */
const PHRASE_PAUSE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Stops any speech. Only calls cancel() when something is playing (an idle cancel() can swallow the next speak()). */
export function stopSpeaking(): void {
  if (!speechSupported()) return;
  generation += 1;
  live.clear();
  if (keepAlive !== null) window.clearInterval(keepAlive);
  keepAlive = null;
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    lastCancelAt = Date.now();
  }
}

async function settle(): Promise<void> {
  const wait = SETTLE_MS - (Date.now() - lastCancelAt);
  if (wait > 0) await sleep(wait);
}

/**
 * iPhone/iPad only speak if the first utterance starts inside a tap. Call this synchronously at the start of a
 * click handler: it speaks a silent dot once, which unlocks speech for the rest of the visit.
 */
export function primeSpeech(): void {
  if (primed || !speechSupported()) return;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios) return;
  primed = true;
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) return;
  const utterance = new SpeechSynthesisUtterance(".");
  utterance.volume = 0;
  live.add(utterance);
  utterance.addEventListener("end", () => live.delete(utterance));
  synth.speak(utterance);
}

/**
 * ok — spoken; no-voice — this computer has no Thai voice; blocked — the browser wants a click first;
 * silent — the voice never started; error — the speech engine failed; stopped — cancelled by Stop or a newer
 * announcement; unsupported — the browser has no speech at all.
 */
export type SpeakStatus = "ok" | "no-voice" | "blocked" | "silent" | "error" | "stopped" | "unsupported";

export interface SpeakResult {
  status: SpeakStatus;
  voice: SpeechSynthesisVoice | null;
}

/** Speaks a queue; resolves with null when it finished, or an error code ("silent" if it never started). */
function playQueue(queue: SpeechSynthesisUtterance[], mine: number): Promise<string | null> {
  const synth = window.speechSynthesis;
  for (const utterance of queue) live.add(utterance);
  // Chrome's Google voices stop after ~15 s; a periodic pause/resume keeps them going. Other voices
  // (installed ones, Edge's natural voices) don't need it and can stutter when paused.
  if (queue.some((utterance) => utterance.voice?.name.startsWith("Google"))) {
    keepAlive = window.setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10_000);
  }
  const totalChars = queue.reduce((sum, u) => sum + u.text.length, 0);
  const safetyMs = 8000 + (totalChars / Math.max(0.5, queue[0]?.rate ?? 1)) * 180;

  return new Promise((resolve) => {
    let settled = false;
    let started = false;
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      window.clearTimeout(timeout);
      if (mine === generation) {
        if (keepAlive !== null) window.clearInterval(keepAlive);
        keepAlive = null;
        live.clear();
      }
      resolve(error);
    };
    const watchdog = window.setTimeout(() => !started && finish("silent"), START_TIMEOUT_MS);
    const timeout = window.setTimeout(() => finish(started ? null : "silent"), safetyMs);
    queue.forEach((utterance, index) => {
      utterance.addEventListener("start", () => {
        started = true;
      });
      utterance.addEventListener("error", (event) => {
        const code = (event as SpeechSynthesisErrorEvent).error || "error";
        // interrupted/canceled caused by Stop or a newer announcement are not failures of this voice.
        finish((code === "interrupted" || code === "canceled") && mine !== generation ? null : code);
      });
      if (index === queue.length - 1) utterance.addEventListener("end", () => finish(null));
    });
    // A paused engine (e.g. after a tab switch) stays silent until resumed.
    if (synth.paused) synth.resume();
    for (const utterance of queue) synth.speak(utterance);
  });
}

function utterances(text: string, voice: SpeechSynthesisVoice, rate: number, volume: number): SpeechSynthesisUtterance[] {
  return splitForSpeech(text).map((chunk) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.pitch = 1;
    return utterance;
  });
}

/** Speaks phrases one after another with a short pause; returns the first error and the phrase it happened on. */
async function speakPhrases(
  phrases: string[],
  from: number,
  voice: SpeechSynthesisVoice,
  rate: number,
  volume: number,
  mine: number,
): Promise<{ error: string | null; index: number }> {
  for (let index = from; index < phrases.length; index += 1) {
    const error = await playQueue(utterances(phrases[index]!, voice, rate, volume), mine);
    if (error !== null || mine !== generation) return { error, index };
    if (index < phrases.length - 1) {
      await sleep(PHRASE_PAUSE_MS);
      if (mine !== generation) return { error: null, index };
    }
  }
  return { error: null, index: phrases.length };
}

/**
 * Speaks Thai phrases with the chosen voice (or the best Thai voice), pausing between phrases like a person
 * would. Never hangs the caller. If the voice fails or stays silent (e.g. an online voice on a weak exam-room
 * network), it carries on from that phrase with another Thai voice, preferring one installed on the computer.
 */
export async function speakThai(phrases: string[], options: { voiceUri: string; rate: number; volume: number }): Promise<SpeakResult> {
  if (!speechSupported()) return { status: "unsupported", voice: null };
  const synth = window.speechSynthesis;
  stopSpeaking();
  const mine = generation;
  const all = synth.getVoices().length ? synth.getVoices() : await loadVoices();
  if (mine !== generation) return { status: "stopped", voice: null };
  const candidates = thaiVoices(all);
  const voice = candidates.find((v) => v.voiceURI === options.voiceUri) ?? candidates[0] ?? null;
  const parts = phrases.map((p) => p.trim()).filter(Boolean);
  if (!voice || !parts.length) return { status: "no-voice", voice: null };

  await settle();
  if (mine !== generation) return { status: "stopped", voice };
  const first = await speakPhrases(parts, 0, voice, options.rate, options.volume, mine);
  if (mine !== generation) return { status: "stopped", voice };
  if (first.error === null) return { status: "ok", voice };
  if (first.error === "not-allowed") return { status: "blocked", voice };

  // Another Thai voice picks up from the phrase that failed; with only one Thai voice (common in Chrome), that
  // voice gets one more try, so the room does not hear just the first half of the announcement.
  const fallback = candidates.find((v) => v !== voice && v.localService) ?? candidates.find((v) => v !== voice) ?? voice;
  stopSpeaking();
  const retryMine = generation;
  await settle();
  if (retryMine !== generation) return { status: "stopped", voice: fallback };
  const retry = await speakPhrases(parts, first.index, fallback, options.rate, options.volume, retryMine);
  if (retryMine !== generation) return { status: "stopped", voice: fallback };
  if (retry.error === null) return { status: "ok", voice: fallback };
  return { status: retry.error === "not-allowed" ? "blocked" : retry.error === "silent" ? "silent" : "error", voice: fallback };
}
