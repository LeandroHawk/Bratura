import { zid } from 'convex-helpers/server/zod4';

/**
 * A reference to a row of another table: typed `Id<'table'>`, stored as `v.id('table')`. The only
 * convex-helpers import in this package (`packages/shared/AGENTS.md`, the exception).
 */
export const documentId = zid;
