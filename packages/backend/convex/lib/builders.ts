import type { RegisteredAction, RegisteredMutation, RegisteredQuery } from 'convex/server';
import type { ObjectType } from 'convex/values';
import {
  zodOutputToConvex,
  zodToConvexFields,
  type ConvexValidatorFromZod,
} from 'convex-helpers/server/zod4';
import type { z } from 'zod';
import {
  internalAction,
  internalMutation,
  internalQuery,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from '../_generated/server';
import { appError } from './appError';

/** The args as callers see them: Convex's reading of the Zod shape, where a documentId is an `Id`. */
export type CallerArgs<Args extends z.ZodObject> = ObjectType<{
  [Field in keyof Args['shape']]: ConvexValidatorFromZod<Args['shape'][Field], 'required'>;
}>;

type ZodFunction<Ctx, Args extends z.ZodObject, Returns extends z.ZodType> = {
  args: Args;
  returns: Returns;
  handler: (ctx: Ctx, args: z.output<Args>) => Promise<z.input<Returns>>;
};

/**
 * Convex checks the shape, then the whole Zod `args` parses (`invalidInput` on failure) and `returns`
 * parses the result. Why not convex-helpers' zCustom*: `packages/backend/AGENTS.md`, The Zod bridge.
 */
function parsedWithZod<Ctx, Args extends z.ZodObject, Returns extends z.ZodType>({
  args,
  returns,
  handler,
}: ZodFunction<Ctx, Args, Returns>) {
  return {
    args: zodToConvexFields(args.shape),
    returns: zodOutputToConvex(returns),
    handler: async (ctx: Ctx, rawArgs: unknown): Promise<z.output<Returns>> => {
      const parsed = await args.safeParseAsync(rawArgs);
      if (!parsed.success) {
        throw appError({
          code: 'invalidInput',
          issues: JSON.parse(JSON.stringify(parsed.error.issues)),
        });
      }
      return await returns.parseAsync(await handler(ctx, parsed.data));
    },
  };
}

// Internal: callable from functions, crons, the CLI and the dashboard; auth comes with the first
// public builder. The casts restate for callers what `parsedWithZod` enforces at run time: TypeScript
// cannot carry Zod generics through Convex's validator inference.
export const internalZodQuery = <Args extends z.ZodObject, Returns extends z.ZodType>(
  definition: ZodFunction<QueryCtx, Args, Returns>,
) =>
  internalQuery(parsedWithZod(definition) as never) as RegisteredQuery<
    'internal',
    CallerArgs<Args>,
    Promise<z.output<Returns>>
  >;

export const internalZodMutation = <Args extends z.ZodObject, Returns extends z.ZodType>(
  definition: ZodFunction<MutationCtx, Args, Returns>,
) =>
  internalMutation(parsedWithZod(definition) as never) as RegisteredMutation<
    'internal',
    CallerArgs<Args>,
    Promise<z.output<Returns>>
  >;

export const internalZodAction = <Args extends z.ZodObject, Returns extends z.ZodType>(
  definition: ZodFunction<ActionCtx, Args, Returns>,
) =>
  internalAction(parsedWithZod(definition) as never) as RegisteredAction<
    'internal',
    CallerArgs<Args>,
    Promise<z.output<Returns>>
  >;
