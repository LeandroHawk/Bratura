import type { CulturalActivityKind } from '@bratura/shared/entities/portfolio-item/enums/activity-kind/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  add: 'Adicionar',
  view: 'Ver',
  edit: 'Editar',
  remove: 'Excluir',
  confirmRemove: 'Excluir de vez',
  cancel: 'Cancelar',
  save: 'Salvar',
  close: 'Fechar',
  onePerLine: 'Um por linha.',
  oneLinkPerLine: 'Um endereço por linha.',
  onePersonPerLine: 'Uma pessoa por linha: nome, função.',
  invalidAmount: 'Digite um valor em reais, como 1.500,00.',
  itemLimit:
    'Limite de 100 registros nesta demonstração. Edite ou exclua um registro para continuar.',
  amountInReais: 'Em reais, como 15.000,00.',
  chooseFile: 'Escolher arquivo',
  chooseFiles: 'Escolher arquivos',
  removeFile: (fileName: string) => `Tirar ${fileName}`,
  removeFileShort: 'Tirar',
  fileRules: (maxMegabytes: number, maxVideoSeconds: number) =>
    `Fotos (JPG, PNG, WebP, GIF), vídeos de até ${maxVideoSeconds} segundos (MP4, WebM, MOV), áudios (MP3, M4A, OGG, WAV) ou PDF; até ${maxMegabytes} MB cada. Nesta demonstração, ficam só neste navegador.`,
  imageRules: (maxMegabytes: number) =>
    `Imagem JPG, PNG, WebP ou GIF, até ${maxMegabytes} MB. Nesta demonstração, fica só neste navegador.`,
  keepingFiles: (count: number) =>
    count === 1 ? 'Conferindo e guardando o arquivo…' : `Conferindo e guardando ${count} arquivos…`,
  fileRefused: (fileName: string, reason: string) => `${fileName}: ${reason}`,
  fileNotKept: 'não foi possível guardar neste navegador. Tente de novo.',
  openingFile: (fileName: string) => `Abrindo ${fileName}…`,
  openFile: (fileName: string) => `Abrir ${fileName}`,
  fileNotInThisBrowser: 'o arquivo não está neste navegador',
  uploadsPending: 'Espere os arquivos terminarem de ser guardados para salvar.',
  activityKind: {
    presentation: 'Apresentação',
    exhibition: 'Exposição',
    fair: 'Feira',
    festival: 'Festival',
    workshop: 'Oficina',
    course: 'Curso',
    culturalEvent: 'Evento cultural',
    other: 'Outros',
  } satisfies Record<CulturalActivityKind, string>,
};

/** The words every form and list of the portfolio repeats. */
export const PORTFOLIO_COMMON_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    add: 'Add',
    view: 'View',
    edit: 'Edit',
    remove: 'Delete',
    confirmRemove: 'Delete for good',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    onePerLine: 'One per line.',
    oneLinkPerLine: 'One address per line.',
    onePersonPerLine: 'One person per line: name, role.',
    invalidAmount: 'Type an amount in reais, such as 1,500.00.',
    itemLimit: 'This demo allows 100 records. Edit or delete a record to continue.',
    amountInReais: 'In reais, like 15.000,00.',
    chooseFile: 'Choose a file',
    chooseFiles: 'Choose files',
    removeFile: (fileName) => `Remove ${fileName}`,
    removeFileShort: 'Remove',
    fileRules: (maxMegabytes, maxVideoSeconds) =>
      `Photos (JPG, PNG, WebP, GIF), videos up to ${maxVideoSeconds} seconds (MP4, WebM, MOV), audios (MP3, M4A, OGG, WAV) or PDF; up to ${maxMegabytes} MB each. In this demo, they stay in this browser only.`,
    imageRules: (maxMegabytes) =>
      `A JPG, PNG, WebP or GIF image, up to ${maxMegabytes} MB. In this demo, it stays in this browser only.`,
    keepingFiles: (count) =>
      count === 1 ? 'Checking and keeping the file…' : `Checking and keeping ${count} files…`,
    fileRefused: (fileName, reason) => `${fileName}: ${reason}`,
    fileNotKept: 'it could not be kept in this browser. Try again.',
    openingFile: (fileName) => `Opening ${fileName}…`,
    openFile: (fileName) => `Open ${fileName}`,
    fileNotInThisBrowser: 'the file is not in this browser',
    uploadsPending: 'Wait for the files to finish being kept before saving.',
    activityKind: {
      presentation: 'Presentation',
      exhibition: 'Exhibition',
      fair: 'Fair',
      festival: 'Festival',
      workshop: 'Workshop',
      course: 'Course',
      culturalEvent: 'Cultural event',
      other: 'Other',
    },
  },
};
