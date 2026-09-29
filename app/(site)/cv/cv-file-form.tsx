"use client";

import { deleteCvFile, uploadCvFile } from "@/app/actions/cv";
import { FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { formatShortDate } from "@/lib/format";
import { replaceFileWithUpload } from "@/lib/cv-upload";
import type { CvFile } from "@/lib/types";

export function CvFileForm({ files }: { files: CvFile[] }) {
  const { state, onSubmit, pending } = useFormAction(uploadCvFile, {
    prepare: (fd) => replaceFileWithUpload(fd, "file"),
  });

  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
              <a href={`/cv/fichier/${f.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-brand-700 hover:underline">
                📄 {f.name}
              </a>
              <span className="text-xs text-muted">{formatShortDate(f.created_at)}</span>
              <form action={deleteCvFile.bind(null, f.id)}>
                <SubmitButton className="text-xs text-accent-600 hover:underline" pendingLabel="…">
                  Retirer
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="cv-file" className="sr-only">Fichier PDF</label>
        <input
          id="cv-file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="text-xs text-muted">PDF uniquement, 5 Mo maximum.</p>
        <SubmitButton pending={pending} className="btn-secondary w-full" pendingLabel="Envoi…">
          Ajouter un PDF
        </SubmitButton>
        <FormAlert state={state} />
      </form>
    </div>
  );
}
