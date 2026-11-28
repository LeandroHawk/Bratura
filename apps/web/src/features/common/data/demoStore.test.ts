import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const fileStore = vi.hoisted(() => ({
  forgetAttachedFileBytes: vi.fn(),
  forgetEveryAttachedFileBytes: vi.fn(),
  keepAttachedFileBytes: vi.fn(),
  attachedFileBytesFromStorageKey: vi.fn(),
  attachedFileStorageKeys: vi.fn(),
}));
vi.mock('./demoFileStore', () => fileStore);

const STORAGE_KEY = 'bratura.demo.v1';
const signUpArgs = {
  email: 'joana@example.com',
  applicantType: 'mei',
  state: 'PE',
  city: 'Caruaru',
  mainCulturalArea: 'music',
} as const;
const example = { creator: FICTIONAL_CREATOR, portfolioItems: FICTIONAL_CREATOR_PORTFOLIO_ITEMS };

let stored: Map<string, string>;

/** The store reads the browser's storage once per load: each test loads it over its own. */
async function storeOver(initial?: string) {
  stored = new Map(initial === undefined ? [] : [[STORAGE_KEY, initial]]);
  vi.stubGlobal('window', {
    addEventListener: () => {},
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    },
  });
  vi.resetModules();
  return import('./demoStore');
}

beforeEach(() => {
  vi.unstubAllGlobals();
  fileStore.attachedFileStorageKeys.mockResolvedValue([]);
  fileStore.keepAttachedFileBytes.mockReset();
  fileStore.forgetAttachedFileBytes.mockClear();
  fileStore.forgetEveryAttachedFileBytes.mockClear();
});

describe('demoStore', () => {
  test.each([
    ['text that is not JSON', '{not json'],
    ['a value of another shape', JSON.stringify(['someone else’s data'])],
    [
      'an account an older version kept',
      JSON.stringify({ isSignedIn: true, creator: { fullName: 'Maria', cpf: '52998224725' } }),
    ],
  ])('starts empty over %s', async (_case, value) => {
    const store = await storeOver(value);
    expect(store.accountReplacedByExample(FICTIONAL_CREATOR)).toBeNull();
    expect(store.signIn('maria@example.com')).toBe(false);
  });

  test('signs up, then signs in with the account’s e-mail only', async () => {
    const store = await storeOver();
    store.signUp(signUpArgs);
    const kept = JSON.parse(stored.get(STORAGE_KEY) ?? '{}');
    expect(kept.creator).toMatchObject(signUpArgs);
    expect(kept.isSignedIn).toBe(true);
    expect(store.signIn('someone@example.com')).toBe(false);
    expect(store.signIn(signUpArgs.email)).toBe(true);
  });

  test('keeps nothing after sign-out', async () => {
    const store = await storeOver();
    store.signUp(signUpArgs);
    store.setSavedCallNotice('a-call', { callNoticeId: 'a-call' as never, remindersOn: true });
    store.signOut();
    expect(stored.has(STORAGE_KEY)).toBe(false);
    expect(store.signIn(signUpArgs.email)).toBe(false);
  });

  test('Dona Maria replaces an account only after the confirmation', async () => {
    const store = await storeOver();
    // Nothing to lose: no question is asked.
    expect(store.accountReplacedByExample(FICTIONAL_CREATOR)).toBeNull();
    store.signUp(signUpArgs);
    // The screen is told whose account would go, and the account is still there.
    expect(store.accountReplacedByExample(FICTIONAL_CREATOR)).toBe(signUpArgs.email);
    expect(JSON.parse(stored.get(STORAGE_KEY) ?? '{}').creator.email).toBe(signUpArgs.email);
    // Confirmed.
    store.loadExample(example);
    expect(JSON.parse(stored.get(STORAGE_KEY) ?? '{}').creator.email).toBe(FICTIONAL_CREATOR.email);
    // Dona Maria over Dona Maria loses nothing.
    expect(store.accountReplacedByExample(FICTIONAL_CREATOR)).toBeNull();
  });
});

test('sign-up cannot replace a stored portfolio without explicit confirmation', async () => {
  const store = await storeOver();
  store.loadExample(example);
  const before = stored.get(STORAGE_KEY);
  expect(store.signUp(signUpArgs)).toBe(false);
  expect(stored.get(STORAGE_KEY)).toBe(before);
  // The screen names the account the confirmation erases.
  expect(store.keptAccountEmail()).toBe(FICTIONAL_CREATOR.email);
  expect(store.signUp(signUpArgs, 'someone-else@example.com')).toBe(false);
  expect(stored.get(STORAGE_KEY)).toBe(before);
  expect(store.signUp(signUpArgs, FICTIONAL_CREATOR.email)).toBe(true);
  expect(JSON.parse(stored.get(STORAGE_KEY) ?? '{}').portfolioItems).toEqual([]);
});

test('editing an item keeps its position and refuses a new item at the limit', async () => {
  const { portfolioItemsMax } = await import('@bratura/shared/entities/portfolio-item/entity');
  const store = await storeOver();
  store.loadExample(example);
  const items = FICTIONAL_CREATOR_PORTFOLIO_ITEMS;
  const first = items[0]!;
  expect(store.setPortfolioItem(first)).toBe(true);
  expect(
    JSON.parse(stored.get(STORAGE_KEY) ?? '{}').portfolioItems.map(
      (item: { clientItemId: string }) => item.clientItemId,
    ),
  ).toEqual(items.map((item) => item.clientItemId));
  for (let i = items.length; i < portfolioItemsMax; i++)
    expect(store.setPortfolioItem({ ...first, clientItemId: `qa-${i}` })).toBe(true);
  expect(store.setPortfolioItem({ ...first, clientItemId: 'over-limit' })).toBe(false);
  expect(store.setPortfolioItem(first)).toBe(true);
});

describe('attached files', () => {
  const photo = (storageKey: string) => ({
    fileName: `${storageKey}.jpg`,
    mediaType: 'image/jpeg' as const,
    sizeInBytes: 1024,
    storageKey,
  });
  const experience = FICTIONAL_CREATOR_PORTFOLIO_ITEMS.find(
    (item) => item.kind === 'culturalExperience',
  )!;

  test('drops a file an older demo kept by name only, not the record holding it', async () => {
    const store = await storeOver(
      JSON.stringify({
        isSignedIn: true,
        creator: {
          ...FICTIONAL_CREATOR,
          profileImage: { fileName: 'x.pdf', mediaType: 'application/pdf', sizeInBytes: 1 },
        },
        portfolioItems: [
          { ...experience, attachments: [{ fileName: 'old', mediaType: '', sizeInBytes: 1 }] },
        ],
      }),
    );
    expect(store.keptAccountEmail()).toBe(FICTIONAL_CREATOR.email);
    store.saveCreatorFields({} as never);
    const kept = JSON.parse(stored.get(STORAGE_KEY) ?? '{}');
    expect(kept.creator.profileImage).toBeNull();
    expect(kept.portfolioItems).toHaveLength(1);
    expect(kept.portfolioItems[0].attachments).toEqual([]);
  });

  test('forgets a replaced profile photo and keeps the new one', async () => {
    const store = await storeOver();
    store.loadExample(example);
    store.saveCreatorFields({
      profileImage: photo('00000000-0000-4000-8000-000000000001'),
    } as never);
    store.saveCreatorFields({
      profileImage: photo('00000000-0000-4000-8000-000000000002'),
    } as never);
    expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([
      '00000000-0000-4000-8000-000000000001',
    ]);
    expect(JSON.parse(stored.get(STORAGE_KEY) ?? '{}').creator.profileImage.storageKey).toBe(
      '00000000-0000-4000-8000-000000000002',
    );
  });

  test('forgets an event’s evidence when it is taken out or the event is deleted', async () => {
    const store = await storeOver();
    store.loadExample(example);
    store.setPortfolioItem({
      ...experience,
      attachments: [
        photo('00000000-0000-4000-8000-000000000001'),
        photo('00000000-0000-4000-8000-000000000002'),
      ],
    });
    store.setPortfolioItem({
      ...experience,
      attachments: [photo('00000000-0000-4000-8000-000000000002')],
    });
    expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([
      '00000000-0000-4000-8000-000000000001',
    ]);
    store.removePortfolioItem(experience.clientItemId);
    expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([
      '00000000-0000-4000-8000-000000000002',
    ]);
  });

  test('keeps the replaced file when the change could not be stored', async () => {
    const store = await storeOver();
    store.loadExample(example);
    store.setPortfolioItem({
      ...experience,
      attachments: [photo('00000000-0000-4000-8000-000000000001')],
    });
    fileStore.forgetAttachedFileBytes.mockClear();
    stored.set = () => {
      throw new Error('QuotaExceededError');
    };
    store.setPortfolioItem({
      ...experience,
      attachments: [photo('00000000-0000-4000-8000-000000000002')],
    });
    expect(fileStore.forgetAttachedFileBytes).not.toHaveBeenCalled();
  });

  test('forgets every file at sign-out', async () => {
    const store = await storeOver();
    store.loadExample(example);
    fileStore.forgetEveryAttachedFileBytes.mockClear();
    store.signOut();
    expect(fileStore.forgetEveryAttachedFileBytes).toHaveBeenCalledOnce();
  });
});

const savedKey = '00000000-0000-4000-8000-000000000001';
const newKey = '00000000-0000-4000-8000-000000000002';
const pdf = (storageKey: string) => ({
  fileName: 'cpf.pdf',
  mediaType: 'application/pdf' as const,
  sizeInBytes: 1,
  storageKey,
});

test('loading sweeps orphan bytes and retains keys from every record file field', async () => {
  const photo = { ...pdf(savedKey), mediaType: 'image/png' };
  const document = example.portfolioItems.find((item) => item.kind === 'document')!;
  const experience = example.portfolioItems.find((item) => item.kind === 'culturalExperience')!;
  const documentKey = '00000000-0000-4000-8000-000000000003';
  const store = await storeOver(
    JSON.stringify({
      isSignedIn: true,
      creator: { ...example.creator, profileImage: photo },
      portfolioItems: [
        { ...experience, attachments: [pdf(newKey)] },
        { ...document, file: pdf(documentKey) },
      ],
    }),
  );
  fileStore.attachedFileStorageKeys.mockResolvedValue([savedKey, newKey, documentKey, 'orphan']);
  store.keptAccountEmail();
  await vi.waitFor(() =>
    expect(fileStore.forgetAttachedFileBytes).toHaveBeenCalledWith(['orphan']),
  );
});

test('a file kept after its dialog closed is immediately forgotten', async () => {
  const store = await storeOver();
  const session = store.attachmentDialog();
  const upload = deferred<string>();
  fileStore.keepAttachedFileBytes.mockReturnValue(upload.promise);
  const result = session.keepPickedFile(new Blob(['bytes']));
  session.close({});
  upload.resolve(newKey);
  await expect(result).resolves.toBeNull();
  expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([newKey]);
});

test('saving is refused throughout concurrent uploads and the pending count clears on failure', async () => {
  const store = await storeOver();
  const session = store.attachmentDialog();
  const upload = deferred<void>();
  const second = deferred<void>();
  const changed = vi.fn();
  const unsubscribe = session.subscribe(changed);
  const firstResult = session.uploadFiles(2, () => upload.promise);
  const secondResult = session.uploadFiles(1, () => second.promise);
  expect(session.pendingUploadCount()).toBe(3);
  expect(session.canSave()).toBe(false);
  upload.resolve(undefined);
  await firstResult;
  expect(session.pendingUploadCount()).toBe(1);
  expect(session.canSave()).toBe(false);
  second.reject(new Error('storage blocked'));
  await expect(secondResult).rejects.toThrow('storage blocked');
  expect(session.pendingUploadCount()).toBe(0);
  expect(session.canSave()).toBe(true);
  expect(changed).toHaveBeenCalledTimes(4);
  unsubscribe();
  session.close({});
});

test('cancel forgets only this dialog’s files, while save retains only its saved keys', async () => {
  const store = await storeOver();
  fileStore.keepAttachedFileBytes.mockResolvedValue(newKey);
  const cancel = store.attachmentDialog();
  await cancel.keepPickedFile(new Blob(['new']));
  cancel.close({ file: pdf(savedKey) });
  expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([newKey]);
  const save = store.attachmentDialog();
  await save.keepPickedFile(new Blob(['new']));
  save.close({ file: pdf(newKey) });
  expect(fileStore.forgetAttachedFileBytes).toHaveBeenLastCalledWith([]);
});

test('removing a file during an upload keeps it removed when the upload completes', async () => {
  const { draftWithKeptFiles } =
    await import('@/features/portfolio/pages/sections/common/form-fields');
  const store = await storeOver();
  const session = store.attachmentDialog();
  const upload = deferred<string>();
  fileStore.keepAttachedFileBytes.mockReturnValue(upload.promise);
  const retainedKey = '00000000-0000-4000-8000-000000000003';
  let draft = { attachments: [pdf(savedKey), pdf(retainedKey)] };
  const result = session.uploadFiles(1, async () => {
    const storageKey = await session.keepPickedFile(new Blob(['new']));
    draft = draftWithKeptFiles(draft, 'attachments', [pdf(storageKey!)], true) as typeof draft;
  });
  draft = { attachments: [pdf(retainedKey)] };
  upload.resolve(newKey);
  await result;
  expect(draft.attachments).toEqual([pdf(retainedKey), pdf(newKey)]);
  session.close({ attachments: draft.attachments });
});

test('two completed batches both merge into the current draft', async () => {
  const { draftWithKeptFiles } =
    await import('@/features/portfolio/pages/sections/common/form-fields');
  const store = await storeOver();
  const session = store.attachmentDialog();
  let draft = { attachments: [pdf(savedKey)] };
  const batches = [deferred<string>(), deferred<string>()];
  fileStore.keepAttachedFileBytes
    .mockReturnValueOnce(batches[0]!.promise)
    .mockReturnValueOnce(batches[1]!.promise);
  const results = batches.map(() =>
    session.uploadFiles(1, async () => {
      const storageKey = await session.keepPickedFile(new Blob(['new']));
      draft = draftWithKeptFiles(draft, 'attachments', [pdf(storageKey!)], true) as typeof draft;
    }),
  );
  const thirdKey = '00000000-0000-4000-8000-000000000003';
  batches[1]!.resolve(thirdKey);
  await results[1];
  batches[0]!.resolve(newKey);
  await results[0];
  expect(draft.attachments.map((file) => file.storageKey)).toEqual([savedKey, thirdKey, newKey]);
  session.close({ attachments: draft.attachments });
});

function deferred<Value>() {
  let resolve!: (value: Value | PromiseLike<Value>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
