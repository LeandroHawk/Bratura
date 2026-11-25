import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { BackendData } from './BackendData';

vi.mock('@/features/common/data/convexClient', () => ({ convexClient: null }));

test('an unconfigured backend renders the unavailable state without mounting query hooks', () => {
  function QueryConsumer(): never {
    throw new Error('A query must not run without a provider');
  }
  const html = renderToStaticMarkup(
    <BackendData
      unavailable={<p role="status">Calls unavailable</p>}
      failed={() => <p role="status">Calls failed</p>}
    >
      <QueryConsumer />
    </BackendData>,
  );
  expect(html).toContain('role="status"');
  expect(html).toContain('Calls unavailable');
});
