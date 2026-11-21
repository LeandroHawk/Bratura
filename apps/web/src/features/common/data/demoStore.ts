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
  type PortfolioItem,
} from '@bratura/shared/entities/portfolio-item/entity';
import { useSyncExternalStore } from 'react';

/**
 * Stands in for the backend until the creator's tables and sign-in exist (after 30/11): what the
 * creator types is kept in this browser only, read back through the same contract the backend
 * will use, and erased at sign-out. No password exists. The one place to swap for Convex.
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

/**
 * The e-mail of the account `loadExample` would erase, or `null` when there is none to lose (no
 * account, or the example itself): the screen asks before loading the example over one.
 */
export function accountReplacedByExample(example: Pick<Creator, 'email'>): string | null {
  const stored = currentState().creator?.email ?? null;
  return stored === example.email ? null : stored;
}

/** Creates the demo account from the sign-up, signed in. */
export function signUp({ mainCulturalArea, ...registration }: SignUpMutationFromBraturaPortalArgs) {
  setState({
    ...EMPTY_STATE,
    creator: { ...registration, ...emptyCulturalProfile, mainCulturalArea },
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

/** The browser keeps nothing after it: the account, the portfolio and the saved calls go. */
export function signOut() {
  state = EMPTY_STATE;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing was kept there either.
  }
  listeners.forEach((listener) => listener());
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
