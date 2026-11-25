import { CALL_NOTICE_LANGUAGE } from './callNoticeTexts';

/** Words taken from the call itself, marked in the call's language whatever the page's. */
export function CallNoticeWords({ children }: { children: string }) {
  return <span lang={CALL_NOTICE_LANGUAGE}>{children}</span>;
}
