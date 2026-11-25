import { z } from 'zod';
import { documentId } from '../../../../../primitives/code/id/fields';
import { paginatedPage, paginationOptions } from '../../../../../primitives/code/pagination/fields';
import { ArtFormEnum } from '../../../../call-notice-extraction/entity';
import { MatchClassificationEnum } from '../../../../match/enums/classification/enum';
import { MatchSchema } from '../../../../match/entity';
import { SourceIdentityFields } from '../../../../source/fragments/identity/fields';
import { CallNoticeSchema } from '../../../entity';
import { CallNoticeDeadlineEnum } from '../../../fragments/registration-window/fields';

/** How many cards one page carries at most. */
export const callNoticeCardsPageMax = 24;

/** Which calls a list keeps, by their close: each value is one index range on the server. */
export const CallNoticeCloseFilterEnum = z.enum([
  'stillOpen',
  'within7Days',
  'within30Days',
  'closed',
]);
export type CallNoticeCloseFilter = z.infer<typeof CallNoticeCloseFilterEnum>;

/** The order of a list: each value is one index on the server. */
export const CallNoticeSortEnum = z.enum(['closestDeadline', 'largestAmount', 'newest']);
export type CallNoticeSort = z.infer<typeof CallNoticeSortEnum>;

/**
 * One call for creators as a list shows it: what the source published, where its deadline stands
 * on the server's clock, and how it fits the profile. Light: the details are another read.
 */
export const CallNoticeCardSchema = z.object({
  callNoticeId: documentId('callNotices'),
  ...CallNoticeSchema.pick({
    title: true,
    officialUrl: true,
    registrationOpens: true,
    registrationCloses: true,
    firstSeenAt: true,
  }).shape,
  /** The source's name: who publishes the call. */
  organizer: SourceIdentityFields.shape.name,
  /** `callNoticeDeadline` on the server's clock; `closed` once the source posts a result. */
  deadline: CallNoticeDeadlineEnum,
  /** Open, with the close a few days away: the server decides how few. */
  closesSoon: z.boolean(),
  /** First seen a few days ago: the server decides how few. */
  isNew: z.boolean(),
  largestAmountPerProjectInCents: MatchSchema.shape.largestAmountPerProjectInCents,
  artForms: z.array(ArtFormEnum),
  /** Never `eligible` for a closed call. */
  classification: MatchClassificationEnum,
});
export type CallNoticeCard = z.infer<typeof CallNoticeCardSchema>;

export const CallNoticeCardsQueryFromBraturaPortalArgsSchema = z.object({
  /** `null`: every classification. */
  classification: MatchClassificationEnum.nullable(),
  closes: CallNoticeCloseFilterEnum,
  sort: CallNoticeSortEnum,
  paginationOpts: paginationOptions(callNoticeCardsPageMax),
});

export const CallNoticeCardsQueryFromBraturaPortalReturnsSchema =
  paginatedPage(CallNoticeCardSchema);
