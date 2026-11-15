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
  type PortfolioItem,
} from '@bratura/shared/entities/portfolio-item/entity';
import { useSyncExternalStore } from 'react';

/**
 * Stands in for the backend until the creator's tables and sign-in exist: everything the creator
 * types is kept in this browser only, read back through the same contract the backend will use.
 * The password is never kept. The one place to swap for Convex queries and mutations.
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

/** Storage is outside the type system: each part is parsed, and a part that fails starts empty. */
function stateFromStorage(): DemoState {
  let stored: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed === 'object' && parsed !== null) stored = parsed as Record<string, unknown>;
  } catch {
    // Unreadable or blocked storage: the demo starts empty.
  }
  const creator = CreatorSchema.nullable().catch(null).parse(stored.creator);
  return {
    creator,
    isSignedIn: creator !== null && stored.isSignedIn === true,
    portfolioItems: PortfolioItemSchema.array().catch([]).parse(stored.portfolioItems),
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
  // Another tab changed the storage: read it again.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = null;
    listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** `null` on the server and on the first paint, before the browser's storage is read. */
export function useDemoState(): DemoState | null {
  return useSyncExternalStore(subscribe, currentState, () => null);
}

export function signUp(registration: CreatorRegistration) {
  setState({
    ...EMPTY_STATE,
    creator: { ...registration, ...emptyCulturalProfile },
    isSignedIn: true,
  });
}

/** Whether an account with this e-mail exists in this browser; signs it in when it does. */
export function signIn(email: string): boolean {
  const current = currentState();
  if (current.creator?.email !== email) return false;
  setState({ ...current, isSignedIn: true });
  return true;
}

export function signOut() {
  setState({ ...currentState(), isSignedIn: false });
}

/** Replaces everything with a ready-made example (the fictional Dona Maria), signed in. */
export function loadExample(example: Pick<DemoState, 'portfolioItems'> & { creator: Creator }) {
  setState({ ...EMPTY_STATE, ...example, isSignedIn: true });
}

export function saveCreatorFields(fields: CreatorRegistration | CreatorCulturalProfile) {
  const current = currentState();
  if (current.creator === null) return;
  setState({ ...current, creator: { ...current.creator, ...fields } });
}

/** Creates the item or replaces the one with the same `clientItemId`. */
export function setPortfolioItem(item: PortfolioItem) {
  const current = currentState();
  const others = current.portfolioItems.filter(
    (existing) => existing.clientItemId !== item.clientItemId,
  );
  setState({ ...current, portfolioItems: [...others, item] });
}

export function removePortfolioItem(clientItemId: string) {
  const current = currentState();
  setState({
    ...current,
    portfolioItems: current.portfolioItems.filter((item) => item.clientItemId !== clientItemId),
  });
}

/** Saves the call or replaces how it is followed; `null` removes it from the saved ones. */
export function setSavedCallNotice(callNoticeId: string, saved: SavedCallNotice | null) {
  const current = currentState();
  const others = current.savedCallNotices.filter((item) => item.callNoticeId !== callNoticeId);
  setState({ ...current, savedCallNotices: saved ? [...others, saved] : others });
}
