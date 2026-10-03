/**
 * Spoken announcements with the browser's built-in voices (Web Speech API) — no server, works offline
 * with installed voices. Handles the well-known rough edges: voices that load late, Chrome cutting off
 * long utterances, and utterances garbage-collected before they finish.
 */

import type { SpokenPart } from "./announcements";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Voices arrive asynchronously (and Safari never fires `voiceschanged`), so poll briefly as well. */
export function loadVoices(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
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

const PREFERRED: Record<"th" | "en", RegExp[]> = {
  th: [/premwadee/i, /niwat/i, /natural/i, /google/i, /kanya/i, /narisa/i, /pattara/i],
  en: [/natural/i, /google uk english female/i, /google us english/i, /google/i, /serena|daniel|samantha|karen|libby|sonia|aria|jenny/i],
};

export function voicesFor(lang: "th" | "en", voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  // Edge occasionally reports half-loaded voices as "Microsoft undefined Online (Natural) - undefined".
  const matching = voices.filter((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith(lang) && !/undefined/i.test(voice.name));
  const score = (voice: SpeechSynthesisVoice) => {
    const index = PREFERRED[lang].findIndex((pattern) => pattern.test(voice.name));
    let s = index === -1 ? 100 : index;
    // International English for an international room: British/US first.
    if (lang === "en" && !/^en-(gb|us)/i.test(voice.lang.replace("_", "-"))) s += 50;
    return s;
  };
  return [...matching].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

export function pickVoice(lang: "th" | "en", voices: SpeechSynthesisVoice[], preferredUri: string): SpeechSynthesisVoice | null {
  const candidates = voicesFor(lang, voices);
  return candidates.find((voice) => voice.voiceURI === preferredUri) ?? candidates[0] ?? null;
}

/**
 * Chrome stops speaking after ~15 s on long utterances, so speak sentence by sentence. Thai has no full stops,
 * so long Thai text is split at spaces into phrases of at most `max` characters.
 */
export function splitForSpeech(text: string, max = 160): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
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

export function stopSpeaking(): void {
  if (!speechSupported()) return;
  generation += 1;
  live.clear();
  if (keepAlive !== null) window.clearInterval(keepAlive);
  keepAlive = null;
  window.speechSynthesis.cancel();
}

export interface SpeakOptions {
  voices: SpeechSynthesisVoice[];
  voiceUris: { th: string; en: string };
  rate: number;
  volume: number;
}

/**
 * ok — everything was spoken; partial — a language had no voice and was skipped; no-voice — nothing to speak with;
 * blocked — the browser wants a click first (autoplay policy); error — the engine failed.
 */
export type SpeakStatus = "ok" | "partial" | "no-voice" | "blocked" | "error";

function utterancesFor(text: string, voice: SpeechSynthesisVoice, options: SpeakOptions): SpeechSynthesisUtterance[] {
  return splitForSpeech(text).map((chunk) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = options.rate;
    utterance.volume = options.volume;
    utterance.pitch = 1;
    return utterance;
  });
}

/** Speaks a queue; resolves with the first error code, or null when the last utterance ended. */
function playQueue(queue: SpeechSynthesisUtterance[], mine: number): Promise<string | null> {
  const synth = window.speechSynthesis;
  for (const utterance of queue) live.add(utterance);
  // Chrome's Google voices stop after ~15 s; a periodic pause/resume keeps them going. Other voices
  // (installed ones, Edge's Natural voices) don't need it and can stutter when paused.
  if (queue.some((utterance) => utterance.voice?.name.startsWith("Google"))) {
    keepAlive = window.setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10_000);
  }
  const totalChars = queue.reduce((sum, u) => sum + u.text.length, 0);
  const rate = queue[0]?.rate ?? 1;
  const safetyMs = 8000 + (totalChars / Math.max(0.5, rate)) * 180;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (mine === generation) {
        if (keepAlive !== null) window.clearInterval(keepAlive);
        keepAlive = null;
        live.clear();
      }
      resolve(error);
    };
    const timeout = window.setTimeout(() => finish(null), safetyMs);
    queue.forEach((utterance, index) => {
      utterance.addEventListener("error", (event) => {
        const code = (event as SpeechSynthesisErrorEvent).error;
        // "interrupted"/"canceled" mean a newer announcement took over — not a failure.
        finish(code === "interrupted" || code === "canceled" ? null : code);
      });
      if (index === queue.length - 1) utterance.addEventListener("end", () => finish(null));
    });
    for (const utterance of queue) synth.speak(utterance);
    if (synth.paused) synth.resume();
  });
}

/**
 * Speaks the parts in order. Never hangs the caller (safety timeout). If an online voice fails
 * (flaky exam-room network), the announcement is retried once with an installed voice.
 */
export async function speak(parts: SpokenPart[], options: SpeakOptions): Promise<SpeakStatus> {
  if (!speechSupported() || parts.length === 0) return "no-voice";
  stopSpeaking();
  const mine = generation;

  const plan = parts
    .map((part) => ({ part, voice: pickVoice(part.lang, options.voices, options.voiceUris[part.lang]) }))
    .filter((item): item is { part: SpokenPart; voice: SpeechSynthesisVoice } => item.voice !== null);
  if (!plan.length) return "no-voice";
  const skipped = plan.length < parts.length;

  const queue = plan.flatMap(({ part, voice }) => utterancesFor(part.text, voice, options));
  const error = await playQueue(queue, mine);
  if (error === null) return skipped ? "partial" : "ok";
  if (error === "not-allowed") return "blocked";
  if (mine !== generation) return "ok";

  // Retry with installed voices only.
  const local = plan
    .map(({ part, voice }) => ({ part, voice: voice.localService ? voice : (voicesFor(part.lang, options.voices).find((v) => v.localService) ?? null) }))
    .filter((item): item is { part: SpokenPart; voice: SpeechSynthesisVoice } => item.voice !== null);
  if (!local.length || local.every((item, i) => item.voice === plan[i]?.voice)) return "error";
  stopSpeaking();
  const retry = await playQueue(
    local.flatMap(({ part, voice }) => utterancesFor(part.text, voice, options)),
    generation,
  );
  return retry === null ? "partial" : retry === "not-allowed" ? "blocked" : "error";
}
