"use client";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.08
) {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* audio unavailable */
  }
}

export function playVoteStart() {
  tone(440, 0.12);
  setTimeout(() => tone(554, 0.15), 80);
}

export function playGoodNews() {
  tone(523, 0.1);
  setTimeout(() => tone(659, 0.1), 90);
  setTimeout(() => tone(784, 0.2), 180);
}

export function playBadNews() {
  tone(220, 0.25, "triangle", 0.1);
  setTimeout(() => tone(165, 0.35, "triangle", 0.08), 120);
}

export function playActionNeeded() {
  tone(880, 0.08, "square", 0.05);
  setTimeout(() => tone(880, 0.08, "square", 0.05), 160);
}
