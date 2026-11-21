import { z } from 'zod';
import { MembershipSchema } from '@bratura/shared/entities/membership/entity';
import { MembershipRoleEnum } from '@bratura/shared/entities/membership/enums/membership-role/enum';
import { OrganizationSchema } from '@bratura/shared/entities/organization/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { requiredSlug, requiredString } from '@bratura/shared/primitives/code/string/fields';
import { internalZodMutation, internalZodQuery } from './lib/builders';

// `organizations` and `memberships`: who pays for the panel and who belongs to it
// (`docs/product.md`, Who pays). Login makes creation a member action later; today rows are
// written by hand for the demo (`docs/plan.md`). The only writer of both tables.

const CreateOrganizationMutationArgsSchema = z.object({
  slug: requiredSlug,
  name: requiredString(),
});
const CreateOrganizationMutationReturnsSchema = documentId('organizations');

/**
 * Inserts the organization the first time its slug is seen and returns the existing row's id
 * afterwards: a natural key lets seeds and ops commands repeat safely.
 */
export const createOrganization = internalZodMutation({
  args: CreateOrganizationMutationArgsSchema,
  returns: CreateOrganizationMutationReturnsSchema,
  handler: async (ctx, { slug, name }) => {
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (index) => index.eq('slug', slug))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert('organizations', { slug, name, createdAt: Date.now() });
  },
});

const GetOrganizationQueryArgsSchema = z.object({ organizationId: documentId('organizations') });
const GetOrganizationQueryReturnsSchema = OrganizationSchema.nullable();

/** An organization as stored, for the billing functions that check it exists. */
export const getOrganization = internalZodQuery({
  args: GetOrganizationQueryArgsSchema,
  returns: GetOrganizationQueryReturnsSchema,
  handler: async (ctx, { organizationId }) => await ctx.db.get(organizationId),
});

const AddOrganizationMemberMutationArgsSchema = z.object({
  organizationId: documentId('organizations'),
  userId: documentId('users'),
  role: MembershipRoleEnum,
});
const AddOrganizationMemberMutationReturnsSchema = documentId('memberships');

/**
 * Gives the user a role in the organization: inserts the membership, or updates the role of the
 * one that already exists for the pair.
 */
export const addOrganizationMember = internalZodMutation({
  args: AddOrganizationMemberMutationArgsSchema,
  returns: AddOrganizationMemberMutationReturnsSchema,
  handler: async (ctx, { organizationId, userId, role }) => {
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_organization_and_user', (index) =>
        index.eq('organizationId', organizationId).eq('userId', userId),
      )
      .unique();
    if (existing) {
      if (existing.role !== role) await ctx.db.patch(existing._id, { role });
      return existing._id;
    }
    return await ctx.db.insert('memberships', {
      organizationId,
      userId,
      role,
      createdAt: Date.now(),
    });
  },
});

const ListOrganizationMembersQueryArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const ListOrganizationMembersQueryReturnsSchema = z.array(MembershipSchema);

/** Every member of an organization: what the panel's ownership check will read. */
export const listOrganizationMembers = internalZodQuery({
  args: ListOrganizationMembersQueryArgsSchema,
  returns: ListOrganizationMembersQueryReturnsSchema,
  handler: async (ctx, { organizationId }) =>
    await ctx.db
      .query('memberships')
      .withIndex('by_organization_and_user', (index) =>
        index.eq('organizationId', organizationId),
      )
      .collect(),
});
