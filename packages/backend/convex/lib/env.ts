// The Convex runtime gives `process.env` (the deployment's variables, set with `convex env set`);
// only that is typed here, so the package needs no `@types/node`.
declare const process: { env: Record<string, string | undefined> };

/** A deployment variable a function cannot run without: throws, naming it, when it is not set. */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in this deployment (convex env set ${name})`);
  return value;
}
