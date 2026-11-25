'use client';

import dynamic from 'next/dynamic';

/**
 * `MuseumMapNav`, server-rendered as usual, its code fetched only by a page that draws it. A server
 * component importing it directly ships it to every page, the landing included, which never does.
 */
export const LazyMuseumMapNav = dynamic(() =>
  import('./MuseumMapNav').then((module) => module.MuseumMapNav),
);
