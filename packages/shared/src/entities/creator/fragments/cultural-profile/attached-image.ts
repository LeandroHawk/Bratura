import { NonVideoAttachedFileSchema } from '../../../../primitives/domain/attached-file/fields';
import {
  AttachedFileMediaTypeEnum,
  attachedFileKindByMediaType,
  type AttachedFileMediaTypeOfKind,
} from '../../../../primitives/domain/attached-file/enum';

export const AttachedImageMediaTypeEnum = AttachedFileMediaTypeEnum.extract(
  AttachedFileMediaTypeEnum.options.filter(
    (mediaType): mediaType is AttachedFileMediaTypeOfKind<'photo'> =>
      attachedFileKindByMediaType[mediaType] === 'photo',
  ),
).meta({ validationMessage: 'notAnImage' });

export const AttachedImageSchema = NonVideoAttachedFileSchema.extend({
  mediaType: AttachedImageMediaTypeEnum,
});
