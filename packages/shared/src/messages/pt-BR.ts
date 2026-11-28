import {
  attachedFileFormatsOfKind,
  attachedFileFormatNames,
} from '../primitives/domain/attached-file/enum';
import { AttachedImageMediaTypeEnum } from '../entities/creator/fragments/cultural-profile/attached-image';
import type { ValidationMessageKey } from '../primitives/code/validation-message/validation-message';
import {
  attachedFileMaxSizeInMegabytes,
  attachedVideoMaxDurationInSeconds,
} from '../primitives/domain/attached-file/fields';

/** The pt-BR object is the shape: `en.ts` must carry the same keys. */
export const ptBRValidationMessages = {
  required: 'Preencha este campo.',
  chooseAnOption: 'Escolha uma opção da lista.',
  email: 'Digite um e-mail completo, como nome@exemplo.com.',
  link: 'Digite o endereço completo, começando com https://.',
  date: 'Digite uma data válida.',
  wholeNumber: 'Digite um número inteiro.',
  invalid: 'Confira este campo.',
  textTooShort: (minimum: number) => `Use pelo menos ${minimum} caracteres.`,
  textTooLong: (maximum: number) => `Use no máximo ${maximum} caracteres.`,
  numberTooSmall: (minimum: number) => `O menor valor aceito é ${minimum}.`,
  numberTooBig: (maximum: number) => `O maior valor aceito é ${maximum}.`,
  listTooLong: (maximum: number) => `Mantenha no máximo ${maximum} itens.`,
  rule: {
    clearanceWithoutValidity: 'Uma certidão tem validade: informe até quando ela vale.',
    endsBeforeItStarts: 'O término não pode vir antes do início.',
    yearInTheFuture: 'Esse ano ainda não chegou.',
    fileTooLarge: `Arquivo acima de ${attachedFileMaxSizeInMegabytes} MB. Envie um arquivo menor.`,
    videoTooLong: `Vídeo com mais de ${attachedVideoMaxDurationInSeconds} segundos. Envie um trecho mais curto.`,
    unsupportedFileType: `Formato não aceito. Envie foto (${attachedFileFormatsOfKind('photo')}), vídeo (${attachedFileFormatsOfKind('video')}), áudio (${attachedFileFormatsOfKind('audio')}) ou ${attachedFileFormatsOfKind('document')}.`,
    notAnImage: `Envie uma imagem: ${attachedFileFormatNames(AttachedImageMediaTypeEnum.options)}.`,
    unreadableFile: 'Não foi possível ler este arquivo. Ele pode estar corrompido.',
  } satisfies Record<ValidationMessageKey, string>,
};

export type ValidationMessages = typeof ptBRValidationMessages;
