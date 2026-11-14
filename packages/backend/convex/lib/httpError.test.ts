import { describe, expect, test } from 'vitest';
import { httpAnswerError } from './httpError';

describe('httpAnswerError', () => {
  test('names the service, the status and why, on one line', async () => {
    const response = new Response('{\n  "error": { "message": "model not found" }\n}', {
      status: 404,
    });
    expect((await httpAnswerError('api.example', response)).message).toBe(
      'api.example answered HTTP 404: { "error": { "message": "model not found" } }',
    );
  });

  test('an empty body leaves the status alone', async () => {
    expect((await httpAnswerError('api.example', new Response('', { status: 503 }))).message).toBe(
      'api.example answered HTTP 503',
    );
  });

  test('a long body is cut', async () => {
    const response = new Response('x'.repeat(1000), { status: 400 });
    const { message } = await httpAnswerError('api.example', response);
    expect(message).toHaveLength('api.example answered HTTP 400: '.length + 300 + 1);
    expect(message.endsWith('…')).toBe(true);
  });
});
