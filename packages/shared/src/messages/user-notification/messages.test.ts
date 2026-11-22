import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { UserNotificationDraft } from '../../entities/user-notification/entity';
import type { ZonedInstant } from '../../primitives/code/time/zoned-instant/fields';
import { userNotificationContentOf } from './content';
import { callNoticeTitleForMessage } from './call-title';
import { registrationCloseText } from './deadline';
import { userNotificationMessageOf } from './messages';

// The message a notification renders, proven for every kind in both locales: the inbox and every
// channel build it from these helpers, so a text the tests pin here is the text a person reads.
const userId = '0000000000000000000000001users' as UserNotificationDraft['userId'];
const callNoticeId = '0000000000000000000000001callNotices' as Extract<
  UserNotificationDraft,
  { kind: 'newEligibleCall' }
>['callNoticeId'];

const saoPaulo = 'America/Sao_Paulo' as ZonedInstant['timeZone'];
const now = new Date('2025-11-10T12:00:00-03:00').getTime();
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now }));
afterEach(() => vi.useRealTimers());
const closes = (iso: string): ZonedInstant => ({
  at: new Date(iso).getTime(),
  timeZone: saoPaulo,
  precision: 'minute',
});

const callNotice = {
  title: 'Edital das Artes 2025',
  officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8498/',
  registrationCloses: closes('2025-11-21T23:59:00-03:00'),
};

const drafts = {
  newEligibleCall: {
    kind: 'newEligibleCall',
    userId,
    dedupeKey: 'new:1',
    callNoticeId,
    matchStatus: 'eligible',
  },
  newEligibleCallAlmost: {
    kind: 'newEligibleCall',
    userId,
    dedupeKey: 'new:2',
    callNoticeId,
    matchStatus: 'almost',
  },
  deadlineSoon: {
    kind: 'deadlineSoon',
    userId,
    dedupeKey: 'deadline:d1',
    callNoticeId,
    occurrence: 'd1',
  },
  callNoticeAmended: {
    kind: 'callNoticeAmended',
    userId,
    dedupeKey: 'amended:1',
    callNoticeId,
    amendedAt: now,
  },
  platformAnnouncement: {
    kind: 'platformAnnouncement',
    userId,
    dedupeKey: 'announce:1',
    title: { ptBR: 'Bem-vinda', en: 'Welcome' },
    body: { ptBR: 'Cadastre seu portfólio.', en: 'Register your portfolio.' },
  },
} satisfies Record<string, UserNotificationDraft>;

describe('userNotificationMessageOf', () => {
  test.each(Object.keys(drafts))('renders %s in both locales', (key) => {
    const draft = drafts[key as keyof typeof drafts];
    const content = userNotificationContentOf(draft, callNotice, now);
    for (const locale of ['pt-BR', 'en'] as const) {
      const message = userNotificationMessageOf(draft, content, locale);
      expect(message?.title.length).toBeGreaterThan(0);
      expect(message?.body.length).toBeGreaterThan(0);
    }
  });

  test('call kinds carry the close text and the official page as the only link', () => {
    for (const key of ['newEligibleCall', 'deadlineSoon', 'callNoticeAmended'] as const) {
      const draft = drafts[key];
      const content = userNotificationContentOf(draft, callNotice, now);
      const message = userNotificationMessageOf(draft, content, 'pt-BR');
      expect(message?.link).toBe(callNotice.officialUrl);
      expect(message?.body).toContain('Edital das Artes 2025');
    }
    const message = userNotificationMessageOf(
      drafts.newEligibleCall,
      userNotificationContentOf(drafts.newEligibleCall, callNotice, now),
      'pt-BR',
    );
    expect(message?.body).toContain('encerram em 21/11, às 23h59');
  });

  test('a deadline message says the days actually left, not the marker fired', () => {
    const d7 = {
      ...drafts.deadlineSoon,
      occurrence: 'd7' as const,
    };
    const closingSoon = {
      ...callNotice,
      registrationCloses: closes('2025-11-12T23:59:00-03:00'),
    };
    const message = userNotificationMessageOf(
      d7,
      userNotificationContentOf(d7, closingSoon, now),
      'pt-BR',
    );
    expect(message?.body).toContain('Faltam 3 dias');
    const en = userNotificationMessageOf(d7, userNotificationContentOf(d7, closingSoon, now), 'en');
    expect(en?.body).toContain('3 days left');
  });

  test('an announcement carries its own text and no link', () => {
    const draft = drafts.platformAnnouncement;
    const message = userNotificationMessageOf(
      draft,
      userNotificationContentOf(draft, null, now),
      'en',
    );
    expect(message).toEqual({
      title: 'Welcome',
      body: 'Register your portfolio.',
      link: null,
    });
  });

  test('a call kind with a gone notice renders nothing', () => {
    const draft = drafts.newEligibleCall;
    expect(
      userNotificationMessageOf(draft, userNotificationContentOf(draft, null, now), 'pt-BR'),
    ).toBeNull();
  });
});

describe('callNoticeTitleForMessage', () => {
  test('strips URLs, collapses line breaks and quotes the title', () => {
    expect(
      callNoticeTitleForMessage('Edital\nhttps://esquema.example.com/golpe\nPremiado 2025'),
    ).toBe('"Edital Premiado 2025"');
  });

  test('cuts a title past its ceiling', () => {
    const cut = callNoticeTitleForMessage(`Edital ${'x'.repeat(500)}`);
    expect(cut.length).toBeLessThanOrEqual(202);
    expect(cut).toContain('…');
  });
});

describe('registrationCloseText', () => {
  test('names the date and time in São Paulo', () => {
    expect(registrationCloseText(closes('2025-11-21T23:59:00-03:00'), 'pt-BR')).toBe(
      'encerram em 21/11, às 23h59',
    );
    expect(registrationCloseText(closes('2025-11-21T23:59:00-03:00'), 'en')).toBe(
      'closes on 11/21 at 23:59 (São Paulo time)',
    );
  });

  test('a close at midnight means the end of the day before', () => {
    // "15/11 00:00" reads to a person as "until the end of the 14th" (docs/data-sources.md).
    expect(registrationCloseText(closes('2025-11-15T00:00:00-03:00'), 'pt-BR')).toBe(
      'encerram em 14/11, às 23h59',
    );
  });

  test('a day-precision close reads as a date, never a time', () => {
    const dayClose: ZonedInstant = {
      at: new Date('2025-11-21T02:59:59.999Z').getTime(),
      timeZone: saoPaulo,
      precision: 'day',
    };
    expect(registrationCloseText(dayClose, 'pt-BR')).toMatch(/^encerram até \d{1,2}\/\d{1,2}$/);
  });

  test('no close, nothing to say', () => {
    expect(registrationCloseText(null, 'pt-BR')).toBeNull();
  });
});

test('a deadline in a different year states its year in both locales', () => {
  const nextYear = closes('2027-01-01T00:00:00-03:00');
  expect(registrationCloseText(nextYear, 'pt-BR')).toContain('31/12/2026');
  expect(registrationCloseText(nextYear, 'en')).toContain('12/31/2026');
});
