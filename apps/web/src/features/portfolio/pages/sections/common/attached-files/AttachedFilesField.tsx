'use client';

import { attachedFileKindByMediaType } from '@bratura/shared/primitives/domain/attached-file/enum';
import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Fieldset, Loading } from '@bratura/ui';
import { useState } from 'react';
import type { AttachmentDialog } from '@/features/common/data/demoStore';
import {
  attachedFileFromBrowserFile,
  acceptedMediaTypes,
  type AttachedFileInputSchema,
} from './attached-file.mapper';
import { AttachedFilePreview } from './AttachedFilePreview';
import { PORTFOLIO_COMMON_CONTENT } from '@/features/portfolio/pages/sections/common/content';

const FILE_INPUT =
  'block w-full cursor-pointer rounded-xl text-small text-muted-foreground focus-ring ' +
  'file:mr-3 file:cursor-pointer file:rounded-full file:border-2 file:border-solid ' +
  'file:border-foreground file:bg-transparent file:px-3.5 file:py-1.5 file:font-body ' +
  'file:text-caption file:font-semibold file:text-foreground';

/**
 * Attaches files to a record: each one picked is read for what it is, checked by the contract and
 * kept in this browser before it joins the draft; a refused one says why and joins nothing.
 */
export function AttachedFilesField({
  locale,
  name,
  legend,
  error,
  className,
  files,
  takesSeveral,
  schema,
  onChange,
  onKeptFiles,
  uploads,
  pendingUploads,
}: {
  locale: Locale;
  name: string;
  legend: string;
  error: string | undefined;
  className: string;
  files: AttachedFile[];
  takesSeveral: boolean;
  schema: AttachedFileInputSchema;
  onChange: (update: (current: AttachedFile[]) => AttachedFile[]) => void;
  onKeptFiles: (files: AttachedFile[]) => void;
  uploads: AttachmentDialog;
  pendingUploads: number;
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const [refusals, setRefusals] = useState<string[]>([]);
  const mediaTypes = acceptedMediaTypes(schema);
  const accept = mediaTypes.join(',');
  const rules = mediaTypes.every((mediaType) => attachedFileKindByMediaType[mediaType] === 'photo')
    ? content.imageRules
    : content.fileRules(mediaTypes);

  async function attach(chosen: File[]) {
    setRefusals([]);
    const results = await uploads.uploadFiles(chosen.length, () =>
      Promise.all(
        chosen.map(async (browserFile) => {
          try {
            const checked = await attachedFileFromBrowserFile(browserFile, schema, locale);
            if (!checked.success)
              return content.fileRefused(
                browserFile.name,
                Object.values(checked.messageByPath)[0] ?? content.fileNotKept,
              );
            // Typed by its bytes, so a blob: URL never opens as what the name says.
            const storageKey = await uploads.keepPickedFile(
              new Blob([browserFile], { type: checked.value.mediaType }),
            );
            if (storageKey === null) return null;
            return { ...checked.value, storageKey };
          } catch {
            return content.fileRefused(browserFile.name, content.fileNotKept);
          }
        }),
      ),
    );
    const kept = results.filter((result) => result !== null && typeof result !== 'string');
    setRefusals(results.filter((result) => typeof result === 'string'));
    if (kept.length > 0) onKeptFiles(kept);
  }

  return (
    <Fieldset legend={legend} hint={rules} error={error} className={className}>
      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <li
              key={file.storageKey ?? `file-${index}`}
              className="rise-in grid content-start gap-2 rounded-xl border border-border bg-card p-3 text-small"
            >
              <AttachedFilePreview file={file} locale={locale} />
              <Button
                size="sm"
                variant="ghost"
                className="justify-self-start"
                aria-label={content.removeFile(file.fileName)}
                onClick={() => onChange((current) => current.filter((other) => other !== file))}
              >
                {content.removeFileShort}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {pendingUploads > 0 && <Loading inline label={content.keepingFiles(pendingUploads)} />}
      {refusals.length > 0 && (
        <div role="alert">
          <ul className="grid gap-1 text-caption font-semibold">
            {refusals.map((refusal, index) => (
              <li
                key={`${index}-${refusal}`}
                className={index === 0 ? 'bt-field-error' : undefined}
              >
                {refusal}
              </li>
            ))}
          </ul>
        </div>
      )}
      <input
        type="file"
        name={name}
        accept={accept}
        multiple={takesSeveral}
        aria-label={`${legend}: ${takesSeveral ? content.chooseFiles : content.chooseFile}`}
        className={FILE_INPUT}
        onChange={(event) => {
          const chosen = [...(event.target.files ?? [])];
          // The same file can be picked again after being removed.
          event.target.value = '';
          if (chosen.length > 0) void attach(chosen);
        }}
      />
    </Fieldset>
  );
}
