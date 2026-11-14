import { convexTest } from 'convex-test';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import type { GenericId } from 'convex/values';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import schema from './schema';
import { federalMapasSource } from './sources.fixture';
import { modules } from './test.setup';

// The `creators` table does not exist yet, so a test fabricates a document id for it: convex-test
// reads the table name off the id's non-digit suffix and never checks the table exists.
const testCreatorId = '0000000000000000000000001creators' as GenericId<'creators'>;

async function withReservedAlert(t: ReturnType<typeof convexTest>) {
  const sourceId = await t.mutation(internal.sources.addSource, { source: federalMapasSource });
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId: '8498',
    title: 'Edital das Artes',
    summary: null,
    officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8498/',
    documentUrls: [],
    registrationOpens: null,
    registrationCloses: {
      at: Date.now() + 9 * 24 * 60 * 60 * 1000,
      timeZone: ianaTimeZone.parse('America/Fortaleza'),
      precision: 'minute',
    },
  });
  const reservation = {
    creatorId: testCreatorId,
    callNoticeId,
    template: 'prazo_chegando' as const,
    occurrence: 'd7',
    channel: 'whatsapp' as const,
    destination: '+5511999999999',
    locale: 'pt-BR' as const,
    variables: ['Dona Maria', 'Edital das Artes', '3'],
  };
  const alertId = await t.mutation(internal.alerts.reserveAlert, reservation);
  return { alertId, reservation };
}

const alertsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('alerts').collect());

describe('reserveAlert', () => {
  test('stores a sending row and never reserves the same alert twice', async () => {
    const t = convexTest(schema, modules);
    const { alertId, reservation } = await withReservedAlert(t);
    expect(await t.mutation(internal.alerts.reserveAlert, reservation)).toBe(alertId);
    expect(await alertsOf(t)).toMatchObject([{ _id: alertId, ...reservation, status: 'sending' }]);
  });

  test('treats a different occurrence as a different alert', async () => {
    const t = convexTest(schema, modules);
    const { alertId, reservation } = await withReservedAlert(t);
    const otherId = await t.mutation(internal.alerts.reserveAlert, {
      ...reservation,
      occurrence: 'd1',
    });
    expect(otherId).not.toBe(alertId);
    expect(await alertsOf(t)).toHaveLength(2);
  });

  test('rejects an empty occurrence, a rule only the Zod parse enforces', async () => {
    const t = convexTest(schema, modules);
    const { reservation } = await withReservedAlert(t);
    await expect(
      t.mutation(internal.alerts.reserveAlert, { ...reservation, occurrence: ' ' }),
    ).rejects.toThrow(/invalidInput/);
  });
});

describe('sendAlert', () => {
  beforeEach(() => {
    vi.stubEnv('NVOIP_CLIENT_ID', 'id');
    vi.stubEnv('NVOIP_CLIENT_SECRET', 'secret');
    vi.stubEnv('NVOIP_WA_INSTANCE', 'instance-1');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function nvoipAnswers(sendStatus = 200) {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes('oauth2/token'))
        return new Response(JSON.stringify({ access_token: 'tok' }));
      if (sendStatus === 200)
        return new Response(JSON.stringify({ message_id: 'wamid.abc' }));
      return new Response('provider overloaded', { status: sendStatus });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  test('sends a reserved alert by WhatsApp and stores the provider message id', async () => {
    const t = convexTest(schema, modules);
    const { alertId, reservation } = await withReservedAlert(t);
    const fetchMock = nvoipAnswers();

    expect(await t.action(internal.alerts.sendAlert, { alertId })).toBe('sent');
    const [stored] = await alertsOf(t);
    expect(stored).toMatchObject({ status: 'sent', providerMessageId: 'wamid.abc' });
    expect(stored).not.toHaveProperty('sendingSince');

    const send = fetchMock.mock.calls.find(([url]) => String(url).includes('sendTemplates'));
    expect(JSON.parse(String(send?.[1]?.body))).toMatchObject({
      idTemplate: reservation.template,
      destination: reservation.destination,
      instance: 'instance-1',
      language: 'pt_BR',
      bodyVariables: reservation.variables,
    });
  });

  test('marks the alert as failed when Nvoip refuses the send', async () => {
    const t = convexTest(schema, modules);
    const { alertId } = await withReservedAlert(t);
    nvoipAnswers(503);

    expect(await t.action(internal.alerts.sendAlert, { alertId })).toBe('failed');
    const [stored] = await alertsOf(t);
    expect(stored).toMatchObject({ status: 'failed', failure: 'providerError' });
  });

  test('skips an alert that is not sending, sending nothing', async () => {
    const t = convexTest(schema, modules);
    const { alertId } = await withReservedAlert(t);
    const fetchMock = nvoipAnswers();
    await t.action(internal.alerts.sendAlert, { alertId });

    expect(await t.action(internal.alerts.sendAlert, { alertId })).toBe('skipped');
    const sends = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('sendTemplates'),
    );
    expect(sends).toHaveLength(1);
  });
});
