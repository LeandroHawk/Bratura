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
  chooseFile: 'Escolher arquivo',
  chooseFiles: 'Escolher arquivos',
  removeFile: (fileName: string) => `Tirar ${fileName}`,
  filesNotice: 'Nesta demonstração, só o nome do arquivo é guardado.',
  noFile: 'Nenhum arquivo.',
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
    chooseFile: 'Choose a file',
    chooseFiles: 'Choose files',
    removeFile: (fileName) => `Remove ${fileName}`,
    filesNotice: 'In this demo, only the file name is kept.',
    noFile: 'No file.',
  },
};
