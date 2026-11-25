import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// Entry point for sign-in until the real screen lands: GET /login sends the visitor to WorkOS.
export async function GET() {
  redirect(await getSignInUrl());
}
