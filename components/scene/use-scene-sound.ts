"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_STORAGE_KEY = "the-scene-sound";

export type SceneSound =
  | "caseOpen"
  | "caseClose"
  | "menuHover"
  | "menuSelect"
  | "paperCover"
  | "paperReveal";

type ToneOptions = {
  start: number;
  end?: number;
  duration: number;
  gain: number;
  delay?: number;
  type?: OscillatorType;
};

function addTone(context: AudioContext, destination: AudioNode, options: ToneOptions) {
  const startedAt = context.currentTime + (options.delay ?? 0);
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.start, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    options.end ?? options.start,
    startedAt + options.duration,
  );
  envelope.gain.setValueAtTime(0.0001, startedAt);
  envelope.gain.exponentialRampToValueAtTime(options.gain, startedAt + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + options.duration);

  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + options.duration + 0.02);
}

function addPaperNoise(
  context: AudioContext,
  destination: AudioNode,
  direction: "cover" | "reveal",
) {
  const duration = direction === "cover" ? 0.42 : 0.68;
  const sampleCount = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    const progress = index / channel.length;
    const texture = Math.sin(index * 0.17) * 0.16;
    channel[index] = (Math.random() * 2 - 1 + texture) * (1 - progress * 0.28);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const startedAt = context.currentTime;

  filter.type = "bandpass";
  filter.Q.setValueAtTime(0.8, startedAt);
  filter.frequency.setValueAtTime(direction === "cover" ? 1500 : 320, startedAt);
  filter.frequency.exponentialRampToValueAtTime(
    direction === "cover" ? 280 : 1900,
    startedAt + duration,
  );
  envelope.gain.setValueAtTime(0.0001, startedAt);
  envelope.gain.exponentialRampToValueAtTime(0.1, startedAt + 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(destination);
  source.start(startedAt);
}

function renderSound(context: AudioContext, destination: AudioNode, sound: SceneSound | "enabled" | "disabled") {
  if (sound === "menuHover") {
    addTone(context, destination, {
      start: 760,
      end: 620,
      duration: 0.045,
      gain: 0.03,
      type: "square",
    });
    return;
  }

  if (sound === "menuSelect") {
    addTone(context, destination, {
      start: 420,
      end: 560,
      duration: 0.07,
      gain: 0.06,
      type: "square",
    });
    addTone(context, destination, {
      start: 720,
      end: 880,
      duration: 0.08,
      gain: 0.045,
      delay: 0.065,
      type: "triangle",
    });
    return;
  }

  if (sound === "caseOpen" || sound === "caseClose") {
    const opening = sound === "caseOpen";
    addTone(context, destination, {
      start: opening ? 170 : 125,
      end: opening ? 92 : 78,
      duration: opening ? 0.24 : 0.16,
      gain: 0.12,
      type: "triangle",
    });
    addTone(context, destination, {
      start: opening ? 980 : 720,
      end: opening ? 540 : 420,
      duration: 0.055,
      gain: 0.05,
      type: "square",
    });
    return;
  }

  if (sound === "paperCover" || sound === "paperReveal") {
    const reveal = sound === "paperReveal";
    addPaperNoise(context, destination, reveal ? "reveal" : "cover");
    addTone(context, destination, {
      start: reveal ? 105 : 145,
      end: reveal ? 185 : 82,
      duration: reveal ? 0.48 : 0.34,
      gain: 0.06,
      type: "triangle",
    });
    return;
  }

  if (sound === "enabled") {
    addTone(context, destination, {
      start: 440,
      end: 540,
      duration: 0.09,
      gain: 0.06,
      type: "square",
    });
    addTone(context, destination, {
      start: 660,
      end: 780,
      duration: 0.11,
      gain: 0.05,
      delay: 0.075,
      type: "triangle",
    });
    return;
  }

  addTone(context, destination, {
    start: 440,
    end: 210,
    duration: 0.12,
    gain: 0.045,
    type: "triangle",
  });
}

export function useSceneSound() {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const soundEnabledRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const getAudio = useCallback(() => {
    let context = contextRef.current;
    let master = masterRef.current;

    if (!context || context.state === "closed" || !master) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.38;
      master.connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
    }

    if (context.state === "suspended") void context.resume();
    return { context, master };
  }, []);

  const playSound = useCallback(
    (sound: SceneSound) => {
      if (!soundEnabledRef.current) return;
      const { context, master } = getAudio();
      renderSound(context, master, sound);
    },
    [getAudio],
  );

  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      soundEnabledRef.current = enabled;
      setSoundEnabledState(enabled);

      try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
      } catch {
        // The sound setting remains available for this visit if storage is blocked.
      }

      const { context, master } = getAudio();
      renderSound(context, master, enabled ? "enabled" : "disabled");
    },
    [getAudio],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SOUND_STORAGE_KEY) === "on";
      soundEnabledRef.current = stored;
      setSoundEnabledState(stored);
    } catch {
      soundEnabledRef.current = false;
    }

    return () => {
      const context = contextRef.current;
      if (context && context.state !== "closed") void context.close();
      contextRef.current = null;
      masterRef.current = null;
    };
  }, []);

  return { soundEnabled, setSoundEnabled, playSound };
}
