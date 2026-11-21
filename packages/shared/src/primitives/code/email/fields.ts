import { z } from 'zod';

/** An address longer than this is refused by mail servers (RFC 5321). */
const emailMaxLength = 254;

/** An e-mail address someone typed: capped, and lowercase so two spellings compare equal. */
export const requiredEmail = z.email().toLowerCase().max(emailMaxLength);
