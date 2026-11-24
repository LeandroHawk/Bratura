import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

describe('createOrganization', () => {
  test('inserts the organization once per slug', async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(internal.organizations.createOrganization, {
      slug: 'demo-assoc',
      name: 'Associação Demo',
    });
    const second = await t.mutation(internal.organizations.createOrganization, {
      slug: 'demo-assoc',
      name: 'Associação Demo',
    });
    expect(second).toBe(first);
    const stored = await t.run((ctx) => ctx.db.query('organizations').collect());
    expect(stored).toHaveLength(1);
  });

  test('refuses a slug the field rule would not take', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.organizations.createOrganization, {
        slug: 'Demo Assoc',
        name: 'Associação Demo',
      }),
    ).rejects.toThrow(/invalidInput/);
  });
});

describe('addOrganizationMember', () => {
  const setup = async (t: ReturnType<typeof convexTest>) => {
    const organizationId = await t.mutation(internal.organizations.createOrganization, {
      slug: 'demo-assoc',
      name: 'Associação Demo',
    });
    const userId = await t.mutation(internal.users.recordUser, {
      tokenIdentifier: 'fixture|member',
      name: null,
      email: null,
    });
    return { organizationId, userId };
  };

  test('inserts the membership and updates the role when the pair repeats', async () => {
    const t = convexTest(schema, modules);
    const { organizationId, userId } = await setup(t);
    const membershipId = await t.mutation(internal.organizations.addOrganizationMember, {
      organizationId,
      userId,
      role: 'member',
    });
    const again = await t.mutation(internal.organizations.addOrganizationMember, {
      organizationId,
      userId,
      role: 'owner',
    });
    expect(again).toBe(membershipId);
    const members = await t.run((ctx) => ctx.db.query('memberships').collect());
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId, role: 'owner' });
  });
});
