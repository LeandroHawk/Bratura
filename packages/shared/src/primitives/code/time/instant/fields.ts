import { z } from 'zod';

/**
 * A point on the timeline, the same everywhere: milliseconds since 1970-01-01T00:00Z, what
 * `Date.now()` and `Date.UTC()` return. It has no calendar and no zone until it is read in one.
 */
export const requiredInstant = z.int().nonnegative();
