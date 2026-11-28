'use client';

import { attachedFileKindByMediaType } from '@bratura/shared/primitives/domain/attached-file/enum';
import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Loading } from '@bratura/ui';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { PORTFOLIO_COMMON_CONTENT } from '@/features/portfolio/pages/sections/common/content';
import { useKeptFileUrl } from './useKeptFileUrl';

/** An attached file as it is: a photo shown, a video or an audio to play, a paper to open. */
export function AttachedFilePreview({ file, locale }: { file: AttachedFile; locale: Locale }) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const url = useKeptFileUrl(file.storageKey);
  const kind = attachedFileKindByMediaType[file.mediaType];

  if (file.storageKey === undefined) return <span>{file.fileName}</span>;

  if (url === undefined) return <Loading inline label={content.openingFile(file.fileName)} />;
  if (url === null)
    return (
      <span className="text-muted-foreground">
        {file.fileName} ({content.fileNotInThisBrowser})
      </span>
    );
  return (
    <figure className="grid gap-1.5">
      {kind === 'photo' && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL
        <img
          src={url}
          alt=""
          className="max-h-60 w-auto max-w-full rounded-xl border border-border object-contain"
        />
      )}
      {kind === 'video' && (
        <video
          src={url}
          controls
          preload="metadata"
          aria-label={file.fileName}
          className="max-h-72 w-full rounded-xl border border-border bg-foreground/5"
        />
      )}
      {kind === 'audio' && (
        <audio src={url} controls aria-label={file.fileName} className="w-full" />
      )}
      <figcaption className="text-small">
        {kind === 'photo' || kind === 'video' || kind === 'audio' ? (
          <span className="break-all">{file.fileName}</span>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-link break-all">
            {content.openFile(file.fileName)}
            <NewTabHint locale={locale} />
          </a>
        )}
      </figcaption>
    </figure>
  );
}
