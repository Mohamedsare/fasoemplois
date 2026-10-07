"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording";

/** Formats proposés dans l'ordre : Chrome / Android (webm), Safari / iPhone (mp4), Firefox (ogg). */
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function micErrorMessage(e: unknown) {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Le micro est bloqué. Autorisez-le dans votre navigateur (icône à gauche de l'adresse), puis réessayez.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Aucun micro détecté sur cet appareil.";
  if (name === "NotReadableError") return "Le micro est déjà utilisé par une autre application (appel en cours ?).";
  return "Impossible de démarrer l'enregistrement. Réessayez.";
}

/**
 * Enregistrement audio dans le navigateur (MediaRecorder), avec durée et niveau sonore en direct.
 * Le fichier est léger (voix, 32 kbit/s) : environ 240 Ko par minute.
 */
export function useRecorder({ maxSeconds, onComplete }: { maxSeconds: number; onComplete: (audio: Blob) => void }) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  });

  const release = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    setLevel(0);
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelled.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError("");
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Votre navigateur ne permet pas l'enregistrement de la voix. Essayez avec Chrome ou Safari à jour, ou écrivez votre texte.");
      return;
    }
    setState("requesting");
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      setState("idle");
      setError(micErrorMessage(e));
      return;
    }
    stream.current = media;

    const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(media, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
    } catch {
      rec = new MediaRecorder(media);
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      release();
      setState("idle");
      if (cancelled.current) return;
      const blob = new Blob(chunks, { type: (rec.mimeType || mimeType || "audio/webm").split(";")[0] });
      done.current(blob);
    };
    recorder.current = rec;
    cancelled.current = false;

    // Niveau sonore : anime le bouton pour montrer que le micro entend bien
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      audioCtx.current = ctx;
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Sans AudioContext : pas d'animation, l'enregistrement fonctionne quand même
    }

    const startedAt = Date.now();
    setSeconds(0);
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) stop();
    }, 250);
    rec.start(1000);
    setState("recording");
  }, [maxSeconds, release, stop]);

  // Quitter la page pendant un enregistrement : on coupe le micro
  useEffect(
    () => () => {
      cancelled.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
    },
    [release],
  );

  return { state, seconds, level, error, setError, start, stop, cancel };
}

export const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
