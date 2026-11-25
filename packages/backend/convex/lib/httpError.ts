const answerExcerptMaxLength = 300;

/**
 * The error for an outside service's non-2xx answer: the status plus the start of the body, which
 * says why ("model not found", "invalid argument"). Only for errors that reach the logs: a body is
 * third-party text, never stored in a table.
 */
export async function httpAnswerError(service: string, response: Response): Promise<Error> {
  const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
  const excerpt =
    body.length > answerExcerptMaxLength ? `${body.slice(0, answerExcerptMaxLength)}…` : body;
  return new Error(`${service} answered HTTP ${response.status}${excerpt ? `: ${excerpt}` : ''}`);
}
