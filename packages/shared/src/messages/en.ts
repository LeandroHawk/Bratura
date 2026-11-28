import {
  attachedFileFormatsOfKind,
  attachedFileFormatNames,
} from '../primitives/domain/attached-file/enum';
import { AttachedImageMediaTypeEnum } from '../entities/creator/fragments/cultural-profile/attached-image';
import type { ValidationMessages } from './pt-BR';
import {
  attachedFileMaxSizeInMegabytes,
  attachedVideoMaxDurationInSeconds,
} from '../primitives/domain/attached-file/fields';

export const enValidationMessages: ValidationMessages = {
  required: 'Fill in this field.',
  chooseAnOption: 'Choose an option from the list.',
  email: 'Type a full e-mail address, like name@example.com.',
  link: 'Type the full address, starting with https://.',
  date: 'Type a valid date.',
  wholeNumber: 'Type a whole number.',
  invalid: 'Check this field.',
  textTooShort: (minimum) => `Use at least ${minimum} characters.`,
  textTooLong: (maximum) => `Use at most ${maximum} characters.`,
  numberTooSmall: (minimum) => `The lowest value accepted is ${minimum}.`,
  numberTooBig: (maximum) => `The highest value accepted is ${maximum}.`,
  listTooLong: (maximum) => `Keep at most ${maximum} items.`,
  rule: {
    clearanceWithoutValidity: 'A clearance certificate expires: say until when it is valid.',
    endsBeforeItStarts: 'The end cannot come before the start.',
    yearInTheFuture: 'That year has not come yet.',
    fileTooLarge: `File over ${attachedFileMaxSizeInMegabytes} MB. Send a smaller file.`,
    videoTooLong: `Video longer than ${attachedVideoMaxDurationInSeconds} seconds. Send a shorter clip.`,
    unsupportedFileType: `Format not accepted. Send a photo (${attachedFileFormatsOfKind('photo')}), a video (${attachedFileFormatsOfKind('video')}), an audio (${attachedFileFormatsOfKind('audio')}) or ${attachedFileFormatsOfKind('document')}.`,
    notAnImage: `Send an image: ${attachedFileFormatNames(AttachedImageMediaTypeEnum.options)}.`,
    unreadableFile: 'This file could not be read. It may be damaged.',
  },
};
