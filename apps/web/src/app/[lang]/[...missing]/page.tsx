import { notFound } from 'next/navigation';

/** Any path under a locale with no page of its own: renders `[lang]/not-found.tsx`, in that locale. */
export default function MissingPage() {
  notFound();
}
