import { z } from 'zod';

/** Longer links are refused: browsers and servers stop agreeing past this length. */
const urlMaxLength = 2048;

/** A link the team registers and ingestion fetches: https only, so nothing is read over plain http. */
export const requiredHttpsUrl = z.url({ protocol: /^https$/ }).max(urlMaxLength);

/**
 * A link that comes from a source and is shown to creators: http or https (some government sites
 * still serve http), never `javascript:` or another scheme a click could run.
 */
export const requiredHttpUrl = z.httpUrl().max(urlMaxLength);
