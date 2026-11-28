import { AttachedImageSchema } from '@bratura/shared/entities/creator/fragments/cultural-profile/attached-image';
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
import {
  forgetEveryAttachedFileBytes,
  forgetAttachedFileBytes,
  keepAttachedFileBytes,
  attachedFileBytesFromStorageKey,
  attachedFileStorageKeys,
} from './demoFileStore';

/** Browser-only creator, portfolio and file persistence until Convex owns them.
 * The one boundary to replace; sign-out erases the demo, including its IndexedDB bytes.
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

/** The only inventory of the file fields a creator or portfolio record can carry. */
function attachedFileFieldsIn(value: unknown) {
  if (typeof value !== 'object' || value === null) return [];
  const record = value as Record<string, unknown>;
  return [
    { name: 'profileImage', schema: AttachedImageSchema, several: false },
    { name: 'attachments', schema: AttachedFileSchema, several: true },
    { name: 'file', schema: AttachedFileSchema, several: false },
  ]
    .filter(({ name }) => name in record)
    .map((field) => ({
      ...field,
      files: [record[field.name]].flat().filter((file) => file != null),
    }));
}

function attachedFilesIn(record: unknown): AttachedFile[] {
  return attachedFileFieldsIn(record).flatMap(({ files, schema }) =>
    files.flatMap((file) => {
      const parsed = schema.safeParse(file);
      return parsed.success ? [parsed.data] : [];
    }),
  );
}

function storageKeysIn(records: unknown[]): Set<string> {
  return new Set(
    records.flatMap((record) => attachedFilesIn(record).flatMap((file) => file.storageKey ?? [])),
  );
}

function forgetFilesLeftBehind(before: unknown[], after: unknown[]) {
  const kept = storageKeysIn(after);
  forgetAttachedFileBytes([...storageKeysIn(before)].filter((key) => !kept.has(key)));
}

/** Invalid legacy metadata is dropped without losing the record that holds it. */
function withoutRefusedFiles(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const record = { ...(value as Record<string, unknown>) };
  for (const { name, schema, several, files } of attachedFileFieldsIn(record)) {
    const accepted = files.filter((file) => schema.safeParse(file).success);
    record[name] = several ? accepted : (accepted[0] ?? null);
  }
  return record;
}

const activeDialogKeys = new Set<Set<string>>();

/** Keeps the picked bytes with their verified type; late results of a closed dialog are erased. */
export function attachmentDialog() {
  const keptHere = new Set<string>();
  let pending = 0;
  let closed = false;
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach((listener) => listener());
  return {
    subscribe(listener: () => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    pendingUploadCount: () => pending,
    canSave: () => !closed && pending === 0,
    async uploadFiles<Result>(count: number, run: () => Promise<Result>): Promise<Result> {
      pending += count;
      notify();
      try {
        return await run();
      } finally {
        pending -= count;
        notify();
      }
    },
    async keepPickedFile(file: Blob): Promise<string | null> {
      const key = await keepAttachedFileBytes(file);
      if (closed) {
        forgetAttachedFileBytes([key]);
        return null;
      }
      activeDialogKeys.add(keptHere);
      keptHere.add(key);
      return key;
    },
    close(saved: unknown) {
      const savedKeys = storageKeysIn([saved]);
      forgetAttachedFileBytes([...keptHere].filter((key) => !savedKeys.has(key)));
      closed = true;
      activeDialogKeys.delete(keptHere);
    },
  };
}
export type AttachmentDialog = ReturnType<typeof attachmentDialog>;

/** A component owns the returned object URL and revokes it after use. */
export async function keptAttachedFileUrl(storageKey: string): Promise<string | null> {
  const file = await attachedFileBytesFromStorageKey(storageKey);
  return file ? URL.createObjectURL(file) : null;
}

async function sweepOrphanedFiles(loaded: DemoState) {
  try {
    const keys = await attachedFileStorageKeys();
    const current = state ?? loaded;
    const kept = storageKeysIn([current.creator, ...current.portfolioItems]);
    for (const dialog of activeDialogKeys) for (const key of dialog) kept.add(key);
    forgetAttachedFileBytes(keys.filter((key) => !kept.has(key)));
  } catch {
    /* Unavailable storage is retried on the next load. */
  }
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
  const loaded: DemoState = {
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
  void sweepOrphanedFiles(loaded);
  return loaded;
}

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function currentState(): DemoState {
  state ??= stateFromStorage();
  return state;
}

/** Whether the change reached storage: a file the stored copy still points at must not go. */
function setState(next: DemoState): boolean {
  state = next;
  let isStored = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the change lives until the tab closes.
    isStored = false;
  }
  listeners.forEach((listener) => listener());
  return isStored;
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
  forgetEveryAttachedFileBytes();
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
  forgetEveryAttachedFileBytes();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing was kept there either.
  }
  listeners.forEach((listener) => listener());
}

/** Replaces everything with a ready-made example (the fictional Dona Maria), signed in. */
export function loadExample(example: Pick<DemoState, 'portfolioItems'> & { creator: Creator }) {
  forgetEveryAttachedFileBytes();
  setState({ ...EMPTY_STATE, ...example, isSignedIn: true });
}

export function saveCreatorFields(fields: CreatorRegistration | CreatorCulturalProfile) {
  const current = currentState();
  if (current.creator === null) return;
  const creator = { ...current.creator, ...fields };
  if (setState({ ...current, creator })) forgetFilesLeftBehind([current.creator], [creator]);
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
  if (setState({ ...current, portfolioItems }))
    forgetFilesLeftBehind(current.portfolioItems, portfolioItems);
  return true;
}

export function removePortfolioItem(clientItemId: string) {
  const current = currentState();
  const portfolioItems = current.portfolioItems.filter(
    (item) => item.clientItemId !== clientItemId,
  );
  if (setState({ ...current, portfolioItems }))
    forgetFilesLeftBehind(current.portfolioItems, portfolioItems);
}

/** Saves the call or replaces how it is followed; `null` removes it from the saved ones. */
export function setSavedCallNotice(callNoticeId: string, saved: SavedCallNotice | null) {
  const current = currentState();
  const others = current.savedCallNotices.filter((item) => item.callNoticeId !== callNoticeId);
  setState({ ...current, savedCallNotices: saved ? [...others, saved] : others });
}
