'use client';

/**
 * A script that runs while the browser parses the server HTML, before the first paint. On a
 * client-side navigation React renders it again but never runs it; marking that render
 * `text/plain` keeps React from warning about a script it will not execute. A Client Component, so
 * the client render sees `window`; on the server the script stays executable.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
