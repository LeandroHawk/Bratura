import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

beforeEach(() => vi.unstubAllGlobals());

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
