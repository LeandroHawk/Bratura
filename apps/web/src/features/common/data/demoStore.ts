import type { SignUpMutationFromBraturaPortalArgs } from '@bratura/shared/entities/creator/dto/bratura-portal/sign-up/mutation';
import {
  CreatorSchema,
  emptyCulturalProfile,
  type Creator,
  type CreatorCulturalProfile,
  type CreatorRegistration,
} from '@bratura/shared/entities/creator/entity';
import {
  SetSavedCallNoticeMutationFromBraturaPortalArgsSchema,
  type SavedCallNotice,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice/mutation';
import {
  PortfolioItemSchema,
  portfolioItemsMax,
  type PortfolioItem,
} from '@bratura/shared/entities/portfolio-item/entity';
import {
  AttachedFileSchema,
  type AttachedFile,
} from '@bratura/shared/primitives/domain/attached-file/fields';
import { useSyncExternalStore } from 'react';
import { forgetAllFiles, forgetFiles } from './demoFileStore';

/**
 * Stands in for the backend until the creator's tables and sign-in exist (after 30/11): what the
 * creator types is kept in this browser only, read back through the same contract the backend
 * will use, and erased at sign-out. No password exists. The one place to swap for Convex. The
 * bytes of attached files live in `demoFileStore.ts`; this store forgets them when nothing points
 * at them anymore.
 */
export type DemoState = {
  creator: Creator | null;
  isSignedIn: boolean;
  portfolioItems: PortfolioItem[];
  savedCallNotices: SavedCallNotice[];
};

const STORAGE_KEY = 'bratura.demo.v1';

const EMPTY_STATE: DemoState = {
  creator: null,
  isSignedIn: false,
  portfolioItems: [],
  savedCallNotices: [],
};

/** The attached files a record points at, wherever its kind keeps them. */
function attachedFilesIn(record: Creator | PortfolioItem | null | undefined): AttachedFile[] {
  if (!record) return [];
  if ('profileImage' in record) return record.profileImage ? [record.profileImage] : [];
  if ('attachments' in record) return record.attachments;
  return record.file ? [record.file] : [];
}

function storageKeysIn(records: (Creator | PortfolioItem | null | undefined)[]): Set<string> {
  return new Set(
    records.flatMap((record) => attachedFilesIn(record).flatMap((file) => file.storageKey ?? [])),
  );
}

/** Forgets the bytes `before` pointed at and `after` no longer does. */
function forgetFilesLeftBehind(
  before: (Creator | PortfolioItem | null | undefined)[],
  after: (Creator | PortfolioItem | null | undefined)[],
) {
  const kept = storageKeysIn(after);
  forgetFiles([...storageKeysIn(before)].filter((key) => !kept.has(key)));
}

/**
 * An older demo kept files by name only, with types and sizes today's contract refuses: such a file
 * is dropped, not the record (or the whole list) that holds it.
 */
function withoutRefusedFiles(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const record = { ...(value as Record<string, unknown>) };
  const accepts = (file: unknown) => AttachedFileSchema.safeParse(file).success;
  if (Array.isArray(record.attachments)) record.attachments = record.attachments.filter(accepts);
  for (const key of ['file', 'profileImage'])
    if (record[key] !== undefined && record[key] !== null && !accepts(record[key]))
      record[key] = null;
  return record;
}

/** Storage is outside the type system: each part is parsed, and a part that fails starts empty. */
function stateFromStorage(): DemoState {
  let stored: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed === 'object' && parsed !== null) stored = parsed as Record<string, unknown>;
  } catch {
    // Unreadable or blocked storage: the demo starts empty.
  }
  const creator = CreatorSchema.nullable().catch(null).parse(withoutRefusedFiles(stored.creator));
  return {
    creator,
    isSignedIn: creator !== null && stored.isSignedIn === true,
    portfolioItems: PortfolioItemSchema.array()
      .max(portfolioItemsMax)
      .catch([])
      .parse(
        Array.isArray(stored.portfolioItems)
          ? stored.portfolioItems.map(withoutRefusedFiles)
          : stored.portfolioItems,
      ),
    savedCallNotices: SetSavedCallNoticeMutationFromBraturaPortalArgsSchema.array()
      .catch([])
      .parse(stored.savedCallNotices),
  };
}

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function currentState(): DemoState {
  state ??= stateFromStorage();
  return state;
}

function setState(next: DemoState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the change lives until the tab closes.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Another tab changed the storage: read it again before the next write, even on a page that
// draws nothing from the store (sign-in), or that write would put the older copy back.
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    state = null;
    listeners.forEach((listener) => listener());
  });

/** `null` on the server and on the first paint, before the browser's storage is read. */
export function useDemoState(): DemoState | null {
  return useSyncExternalStore(subscribe, currentState, () => null);
}

/** The e-mail of the account this browser keeps, if any. */
export function keptAccountEmail(): string | null {
  return currentState().creator?.email ?? null;
}

/**
 * The e-mail of the account `loadExample` would erase, or `null` when there is none to lose (no
 * account, or the example itself): the screen asks before loading the example over one.
 */
export function accountReplacedByExample(example: Pick<Creator, 'email'>): string | null {
  const stored = keptAccountEmail();
  return stored === example.email ? null : stored;
}

/**
 * Creates the demo account from the sign-up, signed in. A kept account is replaced only when it is
 * still the one the person confirmed erasing (`replacedEmail`); another tab may have changed it.
 */
export function signUp(
  { mainCulturalArea, ...registration }: SignUpMutationFromBraturaPortalArgs,
  replacedEmail: string | null = null,
): boolean {
  const kept = keptAccountEmail();
  if (kept !== null && kept !== replacedEmail) return false;
  forgetAllFiles();
  setState({
    ...EMPTY_STATE,
    creator: { ...registration, ...emptyCulturalProfile, mainCulturalArea },
    isSignedIn: true,
  });
  return true;
}

/** Whether an account with this e-mail exists in this browser; signs it in when it does. */
export function signIn(email: string): boolean {
  const current = currentState();
  if (current.creator?.email !== email) return false;
  setState({ ...current, isSignedIn: true });
  return true;
}

/**
 * The browser keeps nothing after it: the account, the portfolio, its files and the saved calls go.
 * Keeping them across a sign-in needs the creator's tables and storage in Convex (after 30/11).
 */
export function signOut() {
  state = EMPTY_STATE;
  forgetAllFiles();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing was kept there either.
  }
  listeners.forEach((listener) => listener());
}

/** Replaces everything with a ready-made example (the fictional Dona Maria), signed in. */
export function loadExample(example: Pick<DemoState, 'portfolioItems'> & { creator: Creator }) {
  forgetAllFiles();
  setState({ ...EMPTY_STATE, ...example, isSignedIn: true });
}

export function saveCreatorFields(fields: CreatorRegistration | CreatorCulturalProfile) {
  const current = currentState();
  if (current.creator === null) return;
  const creator = { ...current.creator, ...fields };
  setState({ ...current, creator });
  forgetFilesLeftBehind([current.creator], [creator]);
}

/** Creates the item or replaces the one with the same `clientItemId`. */
export function setPortfolioItem(item: PortfolioItem): boolean {
  const current = currentState();
  if (!current.isSignedIn || current.creator === null) return false;
  const existing = current.portfolioItems.some((other) => other.clientItemId === item.clientItemId);
  if (!existing && current.portfolioItems.length >= portfolioItemsMax) return false;
  const parsed = PortfolioItemSchema.safeParse(item);
  if (!parsed.success) return false;
  const portfolioItems = existing
    ? current.portfolioItems.map((other) =>
        other.clientItemId === item.clientItemId ? parsed.data : other,
      )
    : [...current.portfolioItems, parsed.data];
  setState({ ...current, portfolioItems });
  forgetFilesLeftBehind(current.portfolioItems, portfolioItems);
  return true;
}

export function removePortfolioItem(clientItemId: string) {
  const current = currentState();
  const portfolioItems = current.portfolioItems.filter(
    (item) => item.clientItemId !== clientItemId,
  );
  setState({ ...current, portfolioItems });
  forgetFilesLeftBehind(current.portfolioItems, portfolioItems);
}

/** Saves the call or replaces how it is followed; `null` removes it from the saved ones. */
export function setSavedCallNotice(callNoticeId: string, saved: SavedCallNotice | null) {
  const current = currentState();
  const others = current.savedCallNotices.filter((item) => item.callNoticeId !== callNoticeId);
  setState({ ...current, savedCallNotices: saved ? [...others, saved] : others });
}
