"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useState } from "react";
import { transcribeBlob } from "@/lib/cv-import-client";
import { formatDuration, useRecorder } from "@/lib/use-recorder";
import { VOICE_MAX_SECONDS } from "@/lib/constants";

/**
 * Petit bouton « Dicter » à côté d'un champ texte : on parle, on arrête, le texte s'ajoute au champ.
 */
export function DictateButton({ onText, label = "Dicter" }: { onText: (text: string) => void; label?: string }) {
  const [transcribing, setTranscribing] = useState(false);
  const rec = useRecorder({
    maxSeconds: VOICE_MAX_SECONDS,
    onComplete: async (audio) => {
      setTranscribing(true);
      const res = await transcribeBlob(audio);
      setTranscribing(false);
      if (res.ok) onText(res.text);
      else rec.setError(res.error);
    },
  });

  const recording = rec.state === "recording";
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => (recording ? rec.stop() : void rec.start())}
        disabled={transcribing || rec.state === "requesting"}
        aria-pressed={recording}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
          recording ? "bg-accent-600 text-white" : "border border-ink/15 bg-white text-ink hover:bg-surface"
        }`}
      >
        {transcribing ? (
          <><Loader2 aria-hidden className="size-3.5 animate-spin" /> Transcription…</>
        ) : recording ? (
          <>
            <Square aria-hidden className="size-3 fill-current" />
            Arrêter · {formatDuration(rec.seconds)}
            <span aria-hidden className="size-2 rounded-full bg-white" style={{ opacity: 0.35 + rec.level * 0.65 }} />
          </>
        ) : (
          <><Mic aria-hidden className="size-3.5" /> {label}</>
        )}
      </button>
      {rec.error && <span role="alert" className="max-w-64 text-right text-xs text-accent-600">{rec.error}</span>}
    </span>
  );
}
