import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { MembershipRoleEnum } from './enums/membership-role/enum';

/**
 * Who belongs to an organization and with which role: the row the panel's ownership check reads
 * (`docs/security.md` §1). Writes: `organizations.ts`.
 */
export const MembershipSchema = z.object({
  organizationId: documentId('organizations'),
  userId: documentId('users'),
  role: MembershipRoleEnum,
  /** When the membership was created. */
  createdAt: requiredInstant,
});

export type Membership = z.infer<typeof MembershipSchema>;
