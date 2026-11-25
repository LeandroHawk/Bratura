import { CreatorCulturalProfileFields } from '@bratura/shared/entities/creator/fragments/cultural-profile/fields';
import { validationMessage } from '@bratura/shared/primitives/code/validation-message/validation-message';

export const CulturalProfileFormSchema = CreatorCulturalProfileFields.refine(
  ({ activityStartYear }) =>
    activityStartYear === null || activityStartYear <= new Date().getFullYear(),
  { path: ['activityStartYear'], ...validationMessage('yearInTheFuture') },
);
