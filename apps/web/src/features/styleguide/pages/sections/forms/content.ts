import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Formulários',
  name: 'Nome completo',
  nameHint: 'Como está no seu documento.',
  cpf: 'CPF',
  cpfError: 'Confira o CPF: os dígitos não batem.',
  state: 'Estado',
  bio: 'Biografia',
  optional: '(opcional)',
  reminder: 'Lembrar do prazo de inscrição',
  dialog: {
    open: 'Abrir o diálogo',
    title: 'Diálogo',
    close: 'Fechar',
    body: {
      before: 'Um',
      after:
        ' nativo: prende o foco, fecha com Esc e devolve o foco a quem o abriu. Usa o tema da página.',
    },
  },
  collapse: {
    closedTitle: 'Vagas reservadas',
    closedBody: 'A placa fica em cima; ao abrir, o puxador desce.',
    openTitle: 'Critérios de avaliação',
    openBody: 'Aberta: clique na placa ou no puxador para fechar.',
  },
};

export const FORMS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Forms',
    name: 'Full name',
    nameHint: 'As it reads on your ID.',
    cpf: 'CPF',
    cpfError: 'Check the CPF: the digits do not match.',
    state: 'State',
    bio: 'Biography',
    optional: '(optional)',
    reminder: 'Remind me of the application deadline',
    dialog: {
      open: 'Open the dialog',
      title: 'Dialog',
      close: 'Close',
      body: {
        before: 'A native',
        after:
          ': it traps focus, closes with Esc and returns focus to what opened it. It follows the page’s theme.',
      },
    },
    collapse: {
      closedTitle: 'Reserved places',
      closedBody: 'The plaque sits on top; opening it lowers the handle.',
      openTitle: 'Evaluation criteria',
      openBody: 'Open: click the plaque or the handle to close it.',
    },
  },
};
