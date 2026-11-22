import { z } from 'zod';

/**
 * What a member may do inside an organization: the `owner` manages billing and members; a plain
 * `member` only follows the organization's creators. Widens when the panel needs it.
 */
export const MembershipRoleEnum = z.enum(['owner', 'member']);

export type MembershipRole = z.infer<typeof MembershipRoleEnum>;
