'use client';

import {
  AttachedFileSchema,
  AttachedImageSchema,
  attachedFileMaxSizeInMegabytes,
  attachedFileMediaTypes,
  attachedImageMediaTypes,
  attachedVideoMaxDurationInSeconds,
  type AttachedFile,
} from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Fieldset, Loading } from '@bratura/ui';
import { useState } from 'react';
import { keepFile } from '@/features/common/data/demoFileStore';
import { attachedFileFromBrowserFile } from './attached-file.mapper';
import { AttachedFilePreview } from './AttachedFilePreview';
import { PORTFOLIO_COMMON_CONTENT } from './content';

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
  acceptsOnlyImages,
  onChange,
  onUploadsChange,
}: {
  locale: Locale;
  name: string;
  legend: string;
  error: string | undefined;
  className: string;
  files: AttachedFile[];
  takesSeveral: boolean;
  acceptsOnlyImages: boolean;
  /** Called with the files after a change: the kept ones added, or one removed. */
  onChange: (files: AttachedFile[]) => void;
  /** How many files are still being read or kept, and each `storageKey` kept. */
  onUploadsChange: (event: { pendingDelta: number } | { keptStorageKey: string }) => void;
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [refusals, setRefusals] = useState<string[]>([]);
  const schema = acceptsOnlyImages ? AttachedImageSchema : AttachedFileSchema;
  const accept = (acceptsOnlyImages ? attachedImageMediaTypes : attachedFileMediaTypes).join(',');
  const rules = acceptsOnlyImages
    ? content.imageRules(attachedFileMaxSizeInMegabytes)
    : content.fileRules(attachedFileMaxSizeInMegabytes, attachedVideoMaxDurationInSeconds);

  async function attach(chosen: File[]) {
    setRefusals([]);
    setPendingNames((names) => [...names, ...chosen.map((file) => file.name)]);
    onUploadsChange({ pendingDelta: chosen.length });
    const results = await Promise.all(
      chosen.map(async (browserFile) => {
        try {
          const checked = await attachedFileFromBrowserFile(browserFile, schema, locale);
          if (!checked.success) return content.fileRefused(browserFile.name, checked.message);
          const storageKey = await keepFile(browserFile);
          onUploadsChange({ keptStorageKey: storageKey });
          return { ...checked.file, storageKey };
        } catch {
          return content.fileRefused(browserFile.name, content.fileNotKept);
        }
      }),
    );
    const kept = results.filter((result) => typeof result !== 'string');
    setRefusals(results.filter((result) => typeof result === 'string'));
    setPendingNames((names) => names.slice(chosen.length));
    onUploadsChange({ pendingDelta: -chosen.length });
    if (kept.length > 0) onChange(takesSeveral ? [...files, ...kept] : kept.slice(-1));
  }

  return (
    <Fieldset legend={legend} hint={rules} error={error} className={className}>
      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <li
              key={file.storageKey ?? `file-${index}`}
              className="rise-in grid gap-2 rounded-xl border border-border bg-card p-3 text-small"
            >
              <AttachedFilePreview file={file} locale={locale} />
              <Button
                size="sm"
                variant="ghost"
                className="justify-self-start"
                aria-label={content.removeFile(file.fileName)}
                onClick={() => onChange(files.filter((other) => other !== file))}
              >
                {content.removeFileShort}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {pendingNames.length > 0 && (
        <Loading inline label={content.keepingFiles(pendingNames.length)} />
      )}
      {refusals.length > 0 && (
        <ul role="alert" className="bt-field-error grid gap-1 text-caption font-semibold">
          {refusals.map((refusal) => (
            <li key={refusal}>{refusal}</li>
          ))}
        </ul>
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
