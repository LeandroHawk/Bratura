import { z } from 'zod';
import { validationMessage } from '../../../../primitives/code/validation-message/validation-message';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';
import { AttachedFileSchema } from '../../../../primitives/domain/attached-file/fields';
import { CulturalAreaEnum } from '../../enums/cultural-area/enum';

/** No creator alive started before this; a typo (`199`) is refused. */
export const culturalActivityStartYearMin = 1900;

/** How many entries each list of the cultural profile keeps. */
export const culturalProfileListMax = 30;

/**
 * Writes: the creator, through the portfolio screen. Comes from: what they type.
 * How the creator presents their work; every field starts empty (`null`, `[]`) after sign-up.
 */
export const CreatorCulturalProfileFields = z.object({
  /** The profile photo or the group's logo. */
  profileImage: AttachedFileSchema.nullable(),
  /** The artistic or trade name; `null` when they go by `fullName`. */
  artisticName: nullableString('medium'),
  biography: nullableString(),
  mainCulturalArea: CulturalAreaEnum.nullable(),
  secondaryCulturalAreas: z.array(CulturalAreaEnum).max(CulturalAreaEnum.options.length),
  /** Free words: "xilogravura", "renda de bilro", "viola caipira". */
  artisticLanguagesAndTechniques: z.array(requiredString('short')).max(culturalProfileListMax),
  /** The year the cultural work began; the years of experience are derived from it, not stored. */
  activityStartYear: z
    .int()
    .min(culturalActivityStartYearMin)
    .refine((year) => year <= new Date().getFullYear(), validationMessage('yearInTheFuture'))
    .nullable(),
  activityDescription: nullableString(),
  // What the calls' most common rules ask (minimum age, time living in the place, public servants
  // barred): optional, asked in the portfolio and never at sign-up; matching answers a rule with
  // them and leaves it "to confirm" while `null`. No quota self-declaration is stored.
  birthDate: z.iso.date().nullable(),
  livesInCurrentPlaceSince: z.iso.date().nullable(),
  isPublicServant: z.boolean().nullable(),
  /** The cities where they work, as they write them ("Juazeiro do Norte - CE"). */
  activityCities: z.array(requiredString('short')).max(culturalProfileListMax),
  /** Social networks, a site, a shop. */
  externalLinks: z.array(requiredHttpUrl).max(culturalProfileListMax),
});
